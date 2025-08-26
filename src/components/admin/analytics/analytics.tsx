import { Button } from '@/components/common';
import { databaseHelpers } from '@/config/database';
import { useSurveyData } from '@/contexts/survey-data-context';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types/framework.types';
import { routes } from '@/routes';
import { BarChart3, Calendar, Clock, Filter, Users } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface AnalyticsData {
    totalResponses: number;
    totalSessions: number;
    completionRate: number;
    abandonmentRate: number;
    averageCompletionTime: number;
    sessionsByStatus: {
        started: number;
        in_progress: number;
        completed: number;
        abandoned: number;
        expired: number;
    };
    responsesByPeriod: Array<{
        period: string;
        count: number;
    }>;
    sessionsByPeriod: Array<{
        period: string;
        started: number;
        completed: number;
        abandoned: number;
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
        sessions: number;
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

    const loadAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Loading analytics data for instance:', selectedInstanceId);
            console.log('🔍 Available survey instances:', surveyInstances);

            // Get survey responses and sessions for selected instance
            let responses: SurveyResponse[] = [];
            let sessions: any[] = [];
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
                    console.log('🔍 Fetching responses and sessions for instance:', instance.id);
                    
                    // Fetch both responses and sessions
                    const [responsesResult, sessionsResult] = await Promise.allSettled([
                        databaseHelpers.getSurveyResponsesFromCollection(instance.id).catch(() => {
                            console.log('❌ Failed to fetch responses, returning empty array');
                            return [];
                        }),
                        databaseHelpers.getSurveySessions(instance.id).catch(() => {
                            console.log('❌ Failed to fetch sessions, returning empty array');
                            return [];
                        })
                    ]);

                    responses = responsesResult.status === 'fulfilled' ? responsesResult.value : [];
                    sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value : [];

                    console.log('🔍 Fetched responses count:', responses.length);
                    console.log('🔍 Fetched sessions count:', sessions.length);
                    console.log('🔍 Session statuses:', sessions.map(s => s.status));

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

            console.log('🔍 Calculating analytics with:', { responses: responses.length, sessions: sessions.length, config: !!config });
            // Calculate analytics (always calculate, even with 0 responses)
            const data = calculateAnalytics(responses, sessions, config, dateRange, groupBy);
            console.log('🔍 Calculated analytics data:', data);
            setAnalyticsData(data);
        } catch (err) {
            console.error('❌ Error loading analytics data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [selectedInstanceId, dateRange, groupBy, surveyInstances]);

    useEffect(() => {
        console.log('🔍 useEffect triggered with:', { selectedInstanceId, dateRange, groupBy });
        loadAnalyticsData();
    }, [selectedInstanceId, dateRange, groupBy, loadAnalyticsData]);

    // Update selected instance when prop changes
    useEffect(() => {
        console.log('🔍 instanceId prop changed:', instanceId);
        setSelectedInstanceId(instanceId);
    }, [instanceId]);

    const calculateAnalytics = (
        responses: SurveyResponse[],
        sessions: any[],
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

        // Filter sessions by date range  
        const filteredSessions = sessions.filter(s => {
            const started = new Date(s.started_at || s.created_at);
            return started >= startDate && started <= now;
        });

        // Calculate session metrics
        const sessionsByStatus = {
            started: filteredSessions.filter(s => s.status === 'started').length,
            in_progress: filteredSessions.filter(s => s.status === 'in_progress').length,
            completed: filteredSessions.filter(s => s.status === 'completed').length,
            abandoned: filteredSessions.filter(s => s.status === 'abandoned').length,
            expired: filteredSessions.filter(s => s.status === 'expired').length,
        };

        const totalSessions = filteredSessions.length;
        const completedSessions = sessionsByStatus.completed;
        const abandonedSessions = sessionsByStatus.abandoned + sessionsByStatus.expired;

        // Calculate total responses
        const totalResponses = filteredResponses.length;

        // Calculate real completion rate based on sessions (sessions completed / total sessions started)
        const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        
        // Calculate abandonment rate
        const abandonmentRate = totalSessions > 0 ? Math.round((abandonedSessions / totalSessions) * 100) : 0;

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

        // Group sessions by period
        const sessionsByPeriod = groupSessionsByPeriod(filteredSessions, groupBy);
        console.log('🔍 Sessions by period:', sessionsByPeriod);

        // Calculate field analysis
        const fieldAnalysis = calculateFieldAnalysis(filteredResponses, config);
        console.log('🔍 Field analysis:', fieldAnalysis);
        console.log('🔍 Config sections:', config?.sections);
        console.log('🔍 Filtered responses:', filteredResponses);

        // Calculate trends
        const trends = calculateTrends(filteredResponses, filteredSessions, groupBy);
        console.log('🔍 Trends:', trends);

        return {
            totalResponses,
            totalSessions,
            completionRate,
            abandonmentRate,
            averageCompletionTime,
            sessionsByStatus,
            responsesByPeriod,
            sessionsByPeriod,
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

    const groupSessionsByPeriod = (sessions: any[], groupBy: string) => {
        const periodData: Record<string, { started: number; completed: number; abandoned: number }> = {};

        sessions.forEach(session => {
            const date = new Date(session.started_at || session.created_at);
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

            if (!periodData[period]) {
                periodData[period] = { started: 0, completed: 0, abandoned: 0 };
            }

            periodData[period].started++;
            
            if (session.status === 'completed') {
                periodData[period].completed++;
            } else if (session.status === 'abandoned' || session.status === 'expired') {
                periodData[period].abandoned++;
            }
        });

        return Object.entries(periodData)
            .map(([period, data]) => ({ period, ...data }))
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

    const calculateTrends = (responses: SurveyResponse[], sessions: any[], groupBy: string) => {
        const responsesByPeriod = groupResponsesByPeriod(responses, groupBy);
        const sessionsByPeriod = groupSessionsByPeriod(sessions, groupBy);

        // Create a combined dataset
        const allPeriods = new Set([
            ...responsesByPeriod.map(r => r.period),
            ...sessionsByPeriod.map(s => s.period)
        ]);

        return Array.from(allPeriods).sort().map(period => {
            const responsePeriod = responsesByPeriod.find(r => r.period === period);
            const sessionPeriod = sessionsByPeriod.find(s => s.period === period);

            const responses = responsePeriod?.count || 0;
            const sessionsStarted = sessionPeriod?.started || 0;
            const sessionsCompleted = sessionPeriod?.completed || 0;
            
            const completionRate = sessionsStarted > 0 
                ? Math.round((sessionsCompleted / sessionsStarted) * 100)
                : 0;

            return {
                date: period,
                responses,
                sessions: sessionsStarted,
                completionRate
            };
        });
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalSessions}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
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
                        <div className="p-2 bg-red-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Abandonment Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{analyticsData.abandonmentRate}%</p>
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

            {/* Session Status Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Session Status Breakdown</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{analyticsData.sessionsByStatus.started}</div>
                        <div className="text-sm text-gray-500">Started</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{analyticsData.sessionsByStatus.in_progress}</div>
                        <div className="text-sm text-gray-500">In Progress</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{analyticsData.sessionsByStatus.completed}</div>
                        <div className="text-sm text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{analyticsData.sessionsByStatus.abandoned}</div>
                        <div className="text-sm text-gray-500">Abandoned</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{analyticsData.sessionsByStatus.expired}</div>
                        <div className="text-sm text-gray-500">Expired</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session & Response Trends */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Session & Response Trends</h3>
                    <div className="h-64 flex items-end justify-between space-x-2 overflow-hidden px-2">
                        {analyticsData.trends.map((trend) => {
                            const maxSessions = Math.max(...analyticsData.trends.map(t => t.sessions));
                            const maxResponses = Math.max(...analyticsData.trends.map(t => t.responses));
                            const maxValue = Math.max(maxSessions, maxResponses, 1);
                            
                            // Calculate available height for bars (leave room for labels)
                            const availableHeight = 180;
                            
                            const sessionHeight = Math.max(8, (trend.sessions / maxValue) * availableHeight);
                            const responseHeight = Math.max(8, (trend.responses / maxValue) * availableHeight);
                            
                            return (
                                <div key={trend.date} className="flex-1 flex flex-col items-center justify-end h-full max-w-[120px]">
                                    {/* Chart bars side by side */}
                                    <div className="flex items-end justify-center space-x-1 mb-2 w-full">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className="w-6 bg-blue-500 rounded-t"
                                                style={{ height: `${sessionHeight}px` }}
                                                title={`Sessions: ${trend.sessions}`}
                                            ></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div
                                                className="w-6 bg-green-500 rounded-t"
                                                style={{ height: `${responseHeight}px` }}
                                                title={`Responses: ${trend.responses}`}
                                            ></div>
                                        </div>
                                    </div>
                                    {/* Labels */}
                                    <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                                        <span className="text-xs text-gray-500 text-center truncate w-full">
                                            {trend.date}
                                        </span>
                                        <span className="text-xs text-gray-400 text-center">
                                            {trend.completionRate}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-center mt-4 space-x-4">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                            <span className="text-sm text-gray-600">Sessions Started</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                            <span className="text-sm text-gray-600">Responses Completed</span>
                        </div>
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
