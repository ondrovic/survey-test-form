// Supabase Edge Function for Advanced Survey Validation
// This function provides server-side validation for survey responses

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  instanceId: string;
  responses: Record<string, any>;
  validateConfig?: {
    checkDuplicates: boolean;
    enforceConstraints: boolean;
    customRules: boolean;
  };
}

interface ValidationResponse {
  success: boolean;
  valid: boolean;
  errors: Array<{
    fieldKey: string;
    errorType: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    fieldKey: string;
    message: string;
  }>;
  metadata: {
    validatedFields: number;
    totalErrors: number;
    totalWarnings: number;
    validationTime: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const { 
      instanceId, 
      responses, 
      validateConfig = {
        checkDuplicates: true,
        enforceConstraints: true,
        customRules: true
      }
    }: ValidationRequest = await req.json()

    const errors: ValidationResponse['errors'] = []
    const warnings: ValidationResponse['warnings'] = []

    // Get survey instance and config
    const { data: instance, error: instanceError } = await supabaseClient
      .from('survey_instances')
      .select(`
        *,
        survey_configs!inner(
          id,
          title,
          sections
        )
      `)
      .eq('id', instanceId)
      .single()

    if (instanceError || !instance) {
      throw new Error(`Survey instance not found: ${instanceId}`)
    }

    // Check if instance is active and within date range
    if (!instance.is_active) {
      errors.push({
        fieldKey: '_instance',
        errorType: 'instance_inactive',
        message: 'This survey is currently inactive',
        severity: 'error'
      })
    }

    if (instance.active_date_range) {
      const now = new Date()
      const startDate = new Date(instance.active_date_range.startDate)
      const endDate = new Date(instance.active_date_range.endDate)

      if (now < startDate) {
        errors.push({
          fieldKey: '_instance',
          errorType: 'survey_not_started',
          message: 'This survey has not started yet',
          severity: 'error'
        })
      }

      if (now > endDate) {
        errors.push({
          fieldKey: '_instance',
          errorType: 'survey_expired',
          message: 'This survey has expired',
          severity: 'error'
        })
      }
    }

    // Get normalized field definitions if available
    const { data: sections, error: sectionsError } = await supabaseClient
      .from('survey_sections')
      .select(`
        *,
        survey_fields(*)
      `)
      .eq('survey_config_id', instance.survey_configs.id)
      .order('order_index')

    let fieldDefinitions: Record<string, any> = {}

    if (!sectionsError && sections) {
      // Use normalized schema
      sections.forEach(section => {
        section.survey_fields?.forEach((field: any) => {
          fieldDefinitions[field.field_key] = field
        })
      })
    } else {
      // Fall back to JSONB schema
      if (instance.survey_configs.sections) {
        instance.survey_configs.sections.forEach((section: any) => {
          section.fields?.forEach((field: any) => {
            fieldDefinitions[field.key] = field
          })
        })
      }
    }

    // Validate each response
    let validatedFields = 0
    for (const [fieldKey, value] of Object.entries(responses)) {
      validatedFields++
      const fieldDef = fieldDefinitions[fieldKey]

      if (!fieldDef) {
        warnings.push({
          fieldKey,
          message: `Field '${fieldKey}' not found in survey definition`
        })
        continue
      }

      // Required field validation
      if (fieldDef.is_required || fieldDef.required) {
        if (value === null || value === undefined || value === '') {
          errors.push({
            fieldKey,
            errorType: 'required',
            message: `${fieldDef.label} is required`,
            severity: 'error'
          })
          continue
        }
      }

      // Type-specific validation
      const fieldType = fieldDef.field_type || fieldDef.type
      switch (fieldType) {
        case 'email':
          if (value && typeof value === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              errors.push({
                fieldKey,
                errorType: 'invalid_email',
                message: `${fieldDef.label} must be a valid email address`,
                severity: 'error'
              })
            }
          }
          break

        case 'number':
          if (value !== null && value !== undefined && value !== '') {
            const numValue = Number(value)
            if (isNaN(numValue)) {
              errors.push({
                fieldKey,
                errorType: 'invalid_number',
                message: `${fieldDef.label} must be a valid number`,
                severity: 'error'
              })
            } else {
              // Min/max validation
              if (fieldDef.min_value !== null && numValue < fieldDef.min_value) {
                errors.push({
                  fieldKey,
                  errorType: 'min_value',
                  message: `${fieldDef.label} must be at least ${fieldDef.min_value}`,
                  severity: 'error'
                })
              }
              if (fieldDef.max_value !== null && numValue > fieldDef.max_value) {
                errors.push({
                  fieldKey,
                  errorType: 'max_value',
                  message: `${fieldDef.label} must be at most ${fieldDef.max_value}`,
                  severity: 'error'
                })
              }
            }
          }
          break

        case 'text':
        case 'textarea':
          if (value && typeof value === 'string') {
            // Length validation
            if (fieldDef.min_length && value.length < fieldDef.min_length) {
              errors.push({
                fieldKey,
                errorType: 'min_length',
                message: `${fieldDef.label} must be at least ${fieldDef.min_length} characters`,
                severity: 'error'
              })
            }
            if (fieldDef.max_length && value.length > fieldDef.max_length) {
              errors.push({
                fieldKey,
                errorType: 'max_length',
                message: `${fieldDef.label} must be at most ${fieldDef.max_length} characters`,
                severity: 'error'
              })
            }

            // Pattern validation
            if (fieldDef.pattern) {
              try {
                const regex = new RegExp(fieldDef.pattern)
                if (!regex.test(value)) {
                  errors.push({
                    fieldKey,
                    errorType: 'pattern_mismatch',
                    message: `${fieldDef.label} format is invalid`,
                    severity: 'error'
                  })
                }
              } catch (e) {
                console.warn(`Invalid regex pattern for field ${fieldKey}:`, fieldDef.pattern)
              }
            }
          }
          break

        case 'multiselect':
        case 'multiselectdropdown':
          if (Array.isArray(value)) {
            // Min/max selections validation
            if (fieldDef.min_selections && value.length < fieldDef.min_selections) {
              errors.push({
                fieldKey,
                errorType: 'min_selections',
                message: `${fieldDef.label} requires at least ${fieldDef.min_selections} selections`,
                severity: 'error'
              })
            }
            if (fieldDef.max_selections && value.length > fieldDef.max_selections) {
              errors.push({
                fieldKey,
                errorType: 'max_selections',
                message: `${fieldDef.label} allows at most ${fieldDef.max_selections} selections`,
                severity: 'error'
              })
            }
          } else if (value !== null && value !== undefined) {
            errors.push({
              fieldKey,
              errorType: 'invalid_type',
              message: `${fieldDef.label} must be an array of values`,
              severity: 'error'
            })
          }
          break
      }
    }

    // Check for duplicate submissions if enabled
    if (validateConfig.checkDuplicates) {
      // This would check for similar responses based on IP, browser fingerprint, etc.
      // For now, we'll skip this implementation
    }

    // Custom business rules validation
    if (validateConfig.customRules) {
      // Example: Check for suspicious patterns
      const responseCount = Object.keys(responses).length
      const totalFields = Object.keys(fieldDefinitions).length
      
      if (responseCount < totalFields * 0.5) {
        warnings.push({
          fieldKey: '_overall',
          message: 'Response seems incomplete - many fields were left blank'
        })
      }

      // Check for same value in all fields (potential spam)
      const values = Object.values(responses).filter(v => v !== null && v !== undefined && v !== '')
      const uniqueValues = new Set(values.map(v => String(v)))
      
      if (values.length > 3 && uniqueValues.size === 1) {
        warnings.push({
          fieldKey: '_overall',
          message: 'Response pattern may indicate automated submission'
        })
      }
    }

    const validationTime = Date.now() - startTime
    const isValid = errors.length === 0

    const response: ValidationResponse = {
      success: true,
      valid: isValid,
      errors,
      warnings,
      metadata: {
        validatedFields,
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        validationTime
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Validation function error:', error)
    
    const errorResponse: ValidationResponse = {
      success: false,
      valid: false,
      errors: [{
        fieldKey: '_system',
        errorType: 'validation_error',
        message: 'Server validation failed',
        severity: 'error'
      }],
      warnings: [],
      metadata: {
        validatedFields: 0,
        totalErrors: 1,
        totalWarnings: 0,
        validationTime: Date.now() - startTime
      }
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})