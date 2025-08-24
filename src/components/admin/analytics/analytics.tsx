import { Button } from '@/components/common';
import { databaseHelpers } from '@/config/database';
import { useSurveyData } from '@/contexts/survey-data-context';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types/framework.types';
import { routes } from '@/routes';
import { BarChart3, Calendar, Clock, Filter, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AnalyticsData {
    totalResponses: number;
    completionRate: number;
    averageCompletionTime: number;
    responsesByPeriod: Array<{
        period: string;
        count: number;
    }>;
    fieldAnalysis: Array<{
        fieldKey: string;
        fieldType: string;
        responseCount: number;
        valueDistribution: Record<string, number>;
        label: string;
        section: string;
    }>;
    trends: Array<{
        date: string;
        responses: number;
        completionRate: number;
    }>;
}

interface AnalyticsProps {
    instanceId?: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ instanceId }) => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(instanceId);
    const [instance, setInstance] = useState<SurveyInstance | undefined>(undefined);

    const surveyData = useSurveyData();
    const { surveyInstances } = surveyData.state;
    const { loadFrameworkData } = surveyData;

    console.log('🔍 Survey data context:', surveyData);
    console.log('🔍 Survey instances from context:', surveyInstances);

    // Helper function to format completion time
    const formatCompletionTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.round(seconds / 60);
            return `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const remainingMinutes = Math.round((seconds % 3600) / 60);
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
        }
    };

    // Handle visualize button click
    const handleVisualize = () => {
        if (selectedInstanceId) {
            const url = `${window.location.origin}/${routes.adminVisualize(selectedInstanceId)}`;
            window.open(url, '_blank');
        }
    };

    // Ensure data is loaded
    useEffect(() => {
        if (surveyInstances.length === 0) {
            console.log('🔍 No survey instances found, loading framework data...');
            loadFrameworkData();
        }
    }, [surveyInstances.length, loadFrameworkData]);

    useEffect(() => {
        console.log('🔍 useEffect triggered with:', { selectedInstanceId, dateRange, groupBy });
        loadAnalyticsData();
    }, [selectedInstanceId, dateRange, groupBy]);

    // Update selected instance when prop changes
    useEffect(() => {
        console.log('🔍 instanceId prop changed:', instanceId);
        setSelectedInstanceId(instanceId);
    }, [instanceId]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Loading analytics data for instance:', selectedInstanceId);
            console.log('🔍 Available survey instances:', surveyInstances);

            // Get survey responses for selected instance
            let responses: SurveyResponse[] = [];
            let config: SurveyConfig | undefined;
            let instance: SurveyInstance | undefined;

            if (selectedInstanceId) {
                // Get fresh instances from database (like visualization does)
                console.log('🔍 Looking for instance with ID:', selectedInstanceId);
                const freshInstances = await databaseHelpers.getSurveyInstances();
                console.log('🔍 Fresh instances from database:', freshInstances.map(i => ({ id: i.id, slug: i.slug, title: i.title })));

                // Try to find by ID first, then by slug (exactly like visualization does)
                instance = freshInstances.find(i => i.id === selectedInstanceId || i.slug === selectedInstanceId);
                console.log('🔍 Found instance:', instance);
                
                // Update instance state
                setInstance(instance);

                if (instance) {
                    console.log('🔍 Fetching responses for instance:', instance.id);
                    // Add error handling like visualization does
                    responses = await databaseHelpers.getSurveyResponsesFromCollection(instance.id).catch(() => {
                        console.log('❌ Failed to fetch responses, returning empty array');
                        return [];
                    });
                    console.log('🔍 Fetched responses count:', responses.length);
                    console.log('🔍 Fetched responses:', responses);

                    const configResult = await databaseHelpers.getSurveyConfig(instance.configId);
                    config = configResult || undefined;
                    console.log('🔍 Fetched config:', config);
                } else {
                    console.log('❌ No instance found for ID:', selectedInstanceId);
                    throw new Error(`Instance not found: ${selectedInstanceId}`);
                }
            } else {
                // If no instance selected, show message to select one
                setInstance(undefined);
                setAnalyticsData(null);
                setLoading(false);
                return;
            }

            console.log('🔍 Calculating analytics with:', { responses: responses.length, config: !!config });
            // Calculate analytics (always calculate, even with 0 responses)
            const data = calculateAnalytics(responses, config, dateRange, groupBy);
            console.log('🔍 Calculated analytics data:', data);
            setAnalyticsData(data);
        } catch (err) {
            console.error('❌ Error loading analytics data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const calculateAnalytics = (
        responses: SurveyResponse[],
        config: SurveyConfig | undefined,
        dateRange: string,
        groupBy: string
    ): AnalyticsData => {
        const now = new Date();
        const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // Filter responses by date range
        const filteredResponses = responses.filter(r => {
            const submitted = new Date(r.submittedAt);
            return submitted >= startDate && submitted <= now;
        });

        // Calculate total responses
        const totalResponses = filteredResponses.length;

        // Calculate real completion rate based on completion_status field
        const completedResponses = filteredResponses.filter(r => 
            r.completion_status === 'completed' || r.completion_status === undefined // treat undefined as completed for legacy data
        ).length;
        const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

        // Calculate average completion time from completion_time_seconds field
        const responsesWithTime = filteredResponses.filter(r => 
            r.completion_time_seconds && r.completion_time_seconds > 0
        );
        const averageCompletionTime = responsesWithTime.length > 0 
            ? Math.round(responsesWithTime.reduce((sum, r) => sum + (r.completion_time_seconds || 0), 0) / responsesWithTime.length)
            : 0;

        // Group responses by period
        const responsesByPeriod = groupResponsesByPeriod(filteredResponses, groupBy);
        console.log('🔍 Responses by period:', responsesByPeriod);

        // Calculate field analysis
        const fieldAnalysis = calculateFieldAnalysis(filteredResponses, config);
        console.log('🔍 Field analysis:', fieldAnalysis);
        console.log('🔍 Config sections:', config?.sections);
        console.log('🔍 Filtered responses:', filteredResponses);

        // Calculate trends
        const trends = calculateTrends(filteredResponses, groupBy);
        console.log('🔍 Trends:', trends);

        return {
            totalResponses,
            completionRate,
            averageCompletionTime,
            responsesByPeriod,
            fieldAnalysis,
            trends
        };
    };

    const groupResponsesByPeriod = (responses: SurveyResponse[], groupBy: string) => {
        const periodCounts: Record<string, number> = {};

        responses.forEach(response => {
            const date = new Date(response.submittedAt);
            let period: string;

            if (groupBy === 'day') {
                period = date.toISOString().split('T')[0];
            } else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                period = weekStart.toISOString().split('T')[0];
            } else {
                period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            periodCounts[period] = (periodCounts[period] || 0) + 1;
        });

        return Object.entries(periodCounts)
            .map(([period, count]) => ({ period, count }))
            .sort((a, b) => a.period.localeCompare(b.period));
    };

    const calculateFieldAnalysis = (responses: SurveyResponse[], config: SurveyConfig | undefined) => {
        if (!config || responses.length === 0) return [];

        const fieldAnalysis: Array<{
            fieldKey: string;
            fieldType: string;
            responseCount: number;
            valueDistribution: Record<string, number>;
            label: string;
            section: string;
        }> = [];

        // Build field metadata like visualization does
        const fieldIdToLabel: Record<string, string> = {};
        const fieldIdToSection: Record<string, string> = {};
        const fieldIdToPossibleKeys: Record<string, string[]> = {};

        config.sections?.forEach(section => {
            section.fields?.forEach(field => {
                fieldIdToLabel[field.id] = field.label || field.id;
                fieldIdToSection[field.id] = section.title || 'Unknown Section';

                // Create possible keys like visualization does
                const possible: string[] = [field.id];

                // Add descriptive field ID (section + field)
                const descriptiveId = `${section.title} ${field.label}`;
                possible.push(descriptiveId);

                // Add slug variations
                const sectionSlug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                const fieldSlug = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                possible.push(`${sectionSlug}_${fieldSlug}`, `${sectionSlug}-${fieldSlug}`, `${sectionSlug} ${fieldSlug}`);

                fieldIdToPossibleKeys[field.id] = possible;
            });
        });

        // Analyze each field using the same logic as visualization
        Object.keys(fieldIdToLabel).forEach(fieldId => {
            const valueDistribution: Record<string, number> = {};
            let responseCount = 0;

            responses.forEach(response => {
                const r = response.responses || {};
                const keys = fieldIdToPossibleKeys[fieldId] || [fieldId];

                // Try each possible key (like visualization does)
                let value: any = undefined;
                for (const k of keys) {
                    if (r[k] !== undefined) {
                        value = r[k];
                        break;
                    }
                }

                if (value !== undefined) {
                    responseCount++;
                    if (Array.isArray(value)) {
                        value.forEach(v => {
                            const strValue = String(v);
                            valueDistribution[strValue] = (valueDistribution[strValue] || 0) + 1;
                        });
                    } else {
                        const strValue = String(value);
                        valueDistribution[strValue] = (valueDistribution[strValue] || 0) + 1;
                    }
                }
            });

            if (responseCount > 0) {
                fieldAnalysis.push({
                    fieldKey: fieldId,
                    fieldType: 'text', // We could enhance this later
                    responseCount,
                    valueDistribution,
                    label: fieldIdToLabel[fieldId] || fieldId,
                    section: fieldIdToSection[fieldId] || 'Unknown Section'
                });
            }
        });

        return fieldAnalysis;
    };

    const calculateTrends = (responses: SurveyResponse[], groupBy: string) => {
        const periodCounts = groupResponsesByPeriod(responses, groupBy);

        return periodCounts.map(({ period, count }) => ({
            date: period,
            responses: count,
            completionRate: 100 // Simplified
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error}</p>
                <Button onClick={loadAnalyticsData} className="mt-2">
                    Retry
                </Button>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {selectedInstanceId ? 'Survey Analytics' : 'Survey Analytics'}
                        </h2>
                        <p className="text-gray-600">Comprehensive insights into your survey performance</p>
                    </div>
                </div>

                <div className="text-center text-gray-500 py-8">
                    <p>No analytics data available.</p>
                    <p className="text-sm mt-2">Instance ID: {selectedInstanceId || 'None'}</p>
                    <p className="text-sm">Available instances: {surveyInstances.length}</p>
                    {surveyInstances.length > 0 && (
                        <div className="mt-4 text-left">
                            <p className="font-semibold">Available instances:</p>
                            <ul className="text-sm">
                                {surveyInstances.map(inst => (
                                    <li key={inst.id}>
                                        {inst.title} (ID: {inst.id}) - Active: {inst.isActive ? 'Yes' : 'No'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {instance ? `${instance.title} - Analytics` : 'Survey Analytics'}
                    </h2>
                    <p className="text-gray-600">
                        Comprehensive insights into your survey performance
                    </p>
                    {instance && (
                        <>
                        <p className="text-sm text-gray-500">
                            {instance?.description}
                        </p>
                        <p className="text-sm text-blue-500 mb-1">
                            {instance.id}
                        </p>
                        </>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                    <Button
                        onClick={handleVisualize}
                        variant="outline"
                        size="sm"
                        disabled={!selectedInstanceId}
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Visualize
                    </Button>

                    <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="day">By Day</option>
                            <option value="week">By Week</option>
                            <option value="month">By Month</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Responses</p>
                            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalResponses}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{analyticsData.completionRate}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analyticsData.averageCompletionTime > 0
                                    ? formatCompletionTime(analyticsData.averageCompletionTime)
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Trends */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Response Trends</h3>
                    <div className="h-64 flex items-end justify-between space-x-1">
                        {analyticsData.trends.map((trend) => (
                            <div key={trend.date} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-blue-500 rounded-t"
                                    style={{
                                        height: `${(trend.responses / Math.max(...analyticsData.trends.map(t => t.responses))) * 200}px`
                                    }}
                                ></div>
                                <span className="text-xs text-gray-500 mt-2 text-center">
                                    {trend.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Field Analysis */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Field Analysis</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-4">
                        {analyticsData.fieldAnalysis.slice(0, 5).map((field) => (
                            <div key={field.fieldKey} className="border-b border-gray-100 pb-2 last:border-b-0">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-gray-700 block truncate">{field.label}</span>
                                        <span className="text-xs text-gray-500 block truncate">{field.section}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{field.responseCount} responses</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${(field.responseCount / analyticsData.totalResponses) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Field Analysis */}
            {analyticsData.fieldAnalysis.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Detailed Field Analysis</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Field
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Response Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Top Values
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analyticsData.fieldAnalysis.map((field) => (
                                    <tr key={field.fieldKey}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div>
                                                <div>{field.label}</div>
                                                <div className="text-xs text-gray-500">{field.section}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {field.fieldType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {field.responseCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(field.valueDistribution)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 3)
                                                    .map(([value, count]) => (
                                                        <span
                                                            key={value}
                                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {value}: {count}
                                                        </span>
                                                    ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
