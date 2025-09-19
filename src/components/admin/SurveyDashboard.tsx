import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip,
} from 'chart.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { firestoreHelpers } from '../../config/firebase';
import { SurveyData } from '../../types/survey.types';
import {
    AdditionalNotesData,
    filterServiceData,
    filterSubNavData,
    getPopularityLevel,
    getPriorityLevel,
    NavigationData,
    processSurveyData,
    ServiceData
} from '../../utils/dashboard.utils';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface SurveyDashboardProps {
    isVisible: boolean;
    onClose: () => void;
}

interface DashboardState {
    surveys: SurveyData[];
    loading: boolean;
    error: string | null;
    filters: {
        searchTerm: string;
        categoryFilter: string;
        serviceFilter: string;
        ratingFilter: string;
        industryFilter: string;
        subNavFilter: string;
        subNavSearchTerm: string;
        subNavPopularityFilter: string;
    };
}

export const SurveyDashboard: React.FC<SurveyDashboardProps> = ({ isVisible, onClose }) => {
    const [state, setState] = useState<DashboardState>({
        surveys: [],
        loading: true,
        error: null,
        filters: {
            searchTerm: '',
            categoryFilter: 'All',
            serviceFilter: 'All',
            ratingFilter: 'All',
            industryFilter: 'All',
            subNavFilter: 'All',
            subNavSearchTerm: '',
            subNavPopularityFilter: 'All',
        }
    });

    // Process survey data into dashboard format
    const processedData = useMemo(() => {
        if (state.surveys.length === 0) {
            return {
                serviceData: [],
                subNavData: [],
                additionalNotesData: [],
                navigationData: [],
                totalResponses: 0
            };
        }
        return processSurveyData(state.surveys);
    }, [state.surveys]);

    // Filter service data based on current filters
    const filteredServiceData = useMemo(() => {
        return filterServiceData(processedData.serviceData, state.filters);
    }, [processedData.serviceData, state.filters]);

    // Filter sub-nav data
    const filteredSubNavData = useMemo(() => {
        return filterSubNavData(processedData.subNavData, {
            searchTerm: state.filters.subNavSearchTerm,
            categoryFilter: state.filters.subNavFilter,
            popularityFilter: state.filters.subNavPopularityFilter
        });
    }, [processedData.subNavData, state.filters.subNavSearchTerm, state.filters.subNavFilter, state.filters.subNavPopularityFilter]);

    // Load survey data on component mount
    useEffect(() => {
        const loadSurveys = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const surveys = await firestoreHelpers.getSurveys();
                setState(prev => ({ ...prev, surveys, loading: false }));
            } catch (error) {
                console.error('Error loading surveys:', error);
                setState(prev => ({
                    ...prev,
                    error: 'Failed to load survey data',
                    loading: false
                }));
            }
        };

        if (isVisible) {
            loadSurveys();
        }
    }, [isVisible]);

    // Update filter handlers
    const updateFilter = (key: keyof DashboardState['filters'], value: string) => {
        setState(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [key]: value
            }
        }));
    };

    // Get unique service types for filter dropdown
    const serviceTypes = useMemo(() => {
        const types = new Set<string>();
        processedData.serviceData.forEach(service => {
            service.serviceLineHeadings.forEach(heading => {
                if (heading !== 'Other') {
                    types.add(heading);
                }
            });
        });
        return Array.from(types).sort();
    }, [processedData.serviceData]);

    // Calculate statistics
    const stats = useMemo(() => {
        const residential = processedData.serviceData.filter(s => s.categories.includes('Residential')).length;
        const commercial = processedData.serviceData.filter(s => s.categories.includes('Commercial')).length;
        const industries = processedData.serviceData.filter(s => s.categories.includes('Industries')).length;
        const highPriority = processedData.serviceData.filter(s => s.high >= 67).length;

        let subNavTotalOptions = 0;
        if (processedData.subNavData.length > 0) {
            const allOptions = new Set();
            processedData.subNavData.forEach(categoryData => {
                Object.keys(categoryData.optionCounts).forEach(option => {
                    allOptions.add(option);
                });
            });
            subNavTotalOptions = allOptions.size;
        }

        return {
            residential,
            commercial,
            industries,
            highPriority,
            subNavTotalOptions,
            navigationTotalLayouts: processedData.navigationData.length,
            totalServices: processedData.serviceData.length,
            totalResponses: processedData.totalResponses,
            filteredCount: filteredServiceData.length
        };
    }, [processedData, filteredServiceData]);

    if (!isVisible) return null;

    if (state.loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 text-center max-w-md">
                    <div className="text-red-600 mb-4">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
                    <p className="text-gray-600 mb-4">{state.error}</p>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-600 mb-6">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Service Line Survey Analysis Dashboard</h1>
                                    <p className="text-gray-600 mt-1">Comprehensive priority breakdown from franchise survey responses</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 font-semibold text-blue-600">
                                    <span>{stats.totalResponses} Responses</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-green-600">
                                    <span>{stats.totalServices} Services</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-yellow-600">
                                    <span>{stats.filteredCount} Displayed</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-purple-600">
                                    <span>{stats.subNavTotalOptions} Sub-Nav Options</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-pink-600">
                                    <span>{stats.navigationTotalLayouts} Navigation Layouts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                            <div className="text-lg font-bold mb-3">Residential Services</div>
                            <div className="text-3xl font-bold mb-2">{stats.residential}</div>
                            <div className="text-sm opacity-90">Services focused on residential properties</div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                            <div className="text-lg font-bold mb-3">Commercial Services</div>
                            <div className="text-3xl font-bold mb-2">{stats.commercial}</div>
                            <div className="text-sm opacity-90">Services for commercial properties</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                            <div className="text-lg font-bold mb-3">Industry Specializations</div>
                            <div className="text-3xl font-bold mb-2">{stats.industries}</div>
                            <div className="text-sm opacity-90">Specialized industry focus areas</div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                            <div className="text-lg font-bold mb-3">High Priority Services</div>
                            <div className="text-3xl font-bold mb-2">{stats.highPriority}</div>
                            <div className="text-sm opacity-90">Services with 67%+ high priority rating</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                            <div className="text-lg font-bold mb-3">Sub-Nav Options</div>
                            <div className="text-3xl font-bold mb-2">{stats.subNavTotalOptions}</div>
                            <div className="text-sm opacity-90">Total sub-navigation options available</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                            <div className="text-lg font-bold mb-3">Navigation Layouts</div>
                            <div className="text-3xl font-bold mb-2">{stats.navigationTotalLayouts}</div>
                            <div className="text-sm opacity-90">Available navigation layout options</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-6">
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex-1 min-w-64">
                                    <input
                                        type="text"
                                        placeholder="Search services..."
                                        value={state.filters.searchTerm}
                                        onChange={(e) => updateFilter('searchTerm', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <select
                                    value={state.filters.categoryFilter}
                                    onChange={(e) => updateFilter('categoryFilter', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="All">All Service Types</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Industries">Industries</option>
                                </select>

                                <select
                                    value={state.filters.serviceFilter}
                                    onChange={(e) => updateFilter('serviceFilter', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="All">All Services</option>
                                    {serviceTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>

                                <select
                                    value={state.filters.ratingFilter}
                                    onChange={(e) => updateFilter('ratingFilter', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="All">All Ratings</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                    <option value="Not Important">Not Important</option>
                                </select>

                                <select
                                    value={state.filters.industryFilter}
                                    onChange={(e) => updateFilter('industryFilter', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="All">All Industries</option>
                                    <option value="Commerical Large Loss">Commerical Large Loss</option>
                                    <option value="Education">Education</option>
                                    <option value="Energy & Chemical Facilities">Energy & Chemical Facilities</option>
                                    <option value="Entertainment, Arenas">Entertainment, Arenas</option>
                                    <option value="Government & Public Entities">Government & Public Entities</option>
                                    <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
                                    <option value="Hospitality, Hotel & Restaurant">Hospitality, Hotel & Restaurant</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Manufacturing & Distribution">Manufacturing & Distribution</option>
                                    <option value="Maritime">Maritime</option>
                                    <option value="Multi-Family Housing">Multi-Family Housing</option>
                                    <option value="Pharmaceutical Manufacturing">Pharmaceutical Manufacturing</option>
                                    <option value="Religious Institutions">Religious Institutions</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Senior Living & Assisted Living Facilities">Senior Living & Assisted Living Facilities</option>
                                    <option value="Technology & Data Centers">Technology & Data Centers</option>
                                </select>

                                <select
                                    value={state.filters.subNavFilter}
                                    onChange={(e) => updateFilter('subNavFilter', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="All">All Sub-Nav Categories</option>
                                    <option value="Water Damage">Water Damage</option>
                                    <option value="Fire Damage">Fire Damage</option>
                                    <option value="Construction">Construction</option>
                                    <option value="Mold">Mold</option>
                                    <option value="Storm Damage">Storm Damage</option>
                                    <option value="General Cleaning">General Cleaning</option>
                                    <option value="Specially Cleaning">Specially Cleaning</option>
                                    <option value="Biohazard Cleaning">Biohazard Cleaning</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Search Sub-Nav options..."
                                    value={state.filters.subNavSearchTerm}
                                    onChange={(e) => updateFilter('subNavSearchTerm', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />

                                <select
                                    value={state.filters.subNavPopularityFilter}
                                    onChange={(e) => updateFilter('subNavPopularityFilter', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="All">All Popularity Levels</option>
                                    <option value="Very High">Very High</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Priority Chart */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Business Priority Analysis - Where to Focus</h2>
                            <p className="text-gray-600 text-sm mt-1">Specific services ranked by priority - see exactly which services your franchise partners want most</p>
                        </div>
                        <div className="p-6">
                            <div className="h-96">
                                <PriorityChart data={filteredServiceData} />
                            </div>
                        </div>
                    </div>

                    {/* Sub-Nav Chart */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Sub-Navigation Preferences Analysis</h2>
                            <p className="text-gray-600 text-sm mt-1">See which sub-navigation options are most popular across different service categories</p>
                        </div>
                        <div className="p-6">
                            <div className="h-96">
                                <SubNavChart data={filteredSubNavData} />
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Additional Notes Insights</h2>
                            <p className="text-gray-600 text-sm mt-1">Key themes and feedback from franchise partners across different categories</p>
                        </div>
                        <div className="p-6">
                            <AdditionalNotesSection data={processedData.additionalNotesData} />
                        </div>
                    </div>

                    {/* Sub-Nav Table */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Sub-Navigation Analysis</h2>
                            <p className="text-gray-600 text-sm mt-1">Detailed breakdown of Sub-Nav selections and their popularity</p>
                        </div>
                        <div className="p-6">
                            <SubNavTable data={filteredSubNavData} />
                        </div>
                    </div>

                    {/* Navigation Layout Table */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Navigation Layout Preferences</h2>
                            <p className="text-gray-600 text-sm mt-1">Analysis of preferred navigation layouts from survey responses</p>
                        </div>
                        <div className="p-6">
                            <NavigationTable data={processedData.navigationData} />
                        </div>
                    </div>

                    {/* Service Analysis Table */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Complete Service Analysis</h2>
                            <p className="text-gray-600 text-sm mt-1">Detailed breakdown of all survey responses</p>
                        </div>
                        <div className="p-6">
                            <ServiceTable data={filteredServiceData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Priority Chart Component
const PriorityChart: React.FC<{ data: ServiceData[] }> = ({ data }) => {
    const topServices = data.slice(0, 15);

    const chartData = {
        labels: topServices.map(d => {
            let finalLabel = d.cleanDisplayName;
            if (d.categories.length > 1) {
                finalLabel = `${d.cleanDisplayName} (${d.categories.join(', ')})`;
            }
            return finalLabel.length > 35 ? finalLabel.substring(0, 35) + '...' : finalLabel;
        }),
        datasets: [
            {
                label: 'High Priority %',
                data: topServices.map(d => d.high),
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                borderWidth: 1
            },
            {
                label: 'Medium Priority %',
                data: topServices.map(d => d.medium),
                backgroundColor: '#f97316',
                borderColor: '#f97316',
                borderWidth: 1
            },
            {
                label: 'Low Priority %',
                data: topServices.map(d => d.low),
                backgroundColor: '#eab308',
                borderColor: '#eab308',
                borderWidth: 1
            },
            {
                label: 'Not Important %',
                data: topServices.map(d => d.notImportant),
                backgroundColor: '#6b7280',
                borderColor: '#6b7280',
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentage of Responses'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Specific Services'
                },
                ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    font: {
                        size: 11
                    }
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: `Top ${topServices.length} Services by Priority (${data.length} total services)`,
                font: { size: 16, weight: 'bold' as const }
            },
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        }
    };

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                No services match your current filters
            </div>
        );
    }

    return <Bar data={chartData} options={options} />;
};

// Sub-Nav Chart Component
const SubNavChart: React.FC<{ data: Array<{ category: string; option: string; count: number; percentage: number; totalResponses: number }> }> = ({ data }) => {
    const topOptions = data.slice(0, 15);

    const chartData = {
        labels: topOptions.map(d => {
            const label = `${d.option} (${d.category})`;
            return label.length > 30 ? label.substring(0, 30) + '...' : label;
        }),
        datasets: [{
            label: 'Selection Percentage',
            data: topOptions.map(d => d.percentage),
            backgroundColor: '#059669',
            borderColor: '#047857',
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentage of Responses'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Sub-Navigation Options'
                },
                ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    font: {
                        size: 11
                    }
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: `Top ${topOptions.length} Sub-Navigation Preferences (${data.length} options shown)`,
                font: { size: 16, weight: 'bold' as const }
            },
            legend: {
                display: false
            }
        }
    };

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                No Sub-Nav data matches current filters
            </div>
        );
    }

    return <Bar data={chartData} options={options} />;
};

// Additional Notes Section Component
const AdditionalNotesSection: React.FC<{ data: AdditionalNotesData[] }> = ({ data }) => {
    if (data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No additional notes data available
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map(notesData => (
                <div key={notesData.category} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="font-bold text-blue-600 mb-2 text-sm">{notesData.category} Notes</div>
                    <div className="flex gap-4 mb-3 text-xs text-gray-600">
                        <span>{notesData.totalNotes} notes</span>
                        <span>{notesData.avgWordsPerNote} avg words</span>
                        <span>{notesData.wordCount} total words</span>
                    </div>
                    <div className="mb-2 text-xs text-gray-600">
                        <strong>Top themes:</strong>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {notesData.topWords.map(word => (
                            <span key={word} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {word} ({notesData.commonWords[word]})
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Sub-Nav Table Component
const SubNavTable: React.FC<{ data: Array<{ category: string; option: string; count: number; percentage: number; totalResponses: number }> }> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);

    if (data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No Sub-Nav data matches current filters
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Sub-Nav Category</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Selected Option</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Selection Count</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Selection %</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Total Responses</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Popularity Level</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((optionData, index) => {
                        const popularityLevel = getPopularityLevel(optionData.percentage);
                        const formattedOption = optionData.option
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                        return (
                            <tr key={index} className="hover:bg-gray-50 border-b">
                                <td className="p-4 text-sm font-semibold">{optionData.category}</td>
                                <td className="p-4 text-sm">{formattedOption}</td>
                                <td className="p-4 text-sm text-center font-semibold">{optionData.count}</td>
                                <td className="p-4 text-sm text-center font-semibold">{optionData.percentage}%</td>
                                <td className="p-4 text-sm text-center">{optionData.totalResponses}</td>
                                <td className="p-4">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPopularityBadgeClass(popularityLevel)}`}>
                                        {popularityLevel}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Navigation Table Component
const NavigationTable: React.FC<{ data: NavigationData[] }> = ({ data }) => {
    if (data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No navigation layout data available
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Navigation Layout</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Selection Count</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Selection %</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Total Responses</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Preference Level</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((layoutData, index) => {
                        const preferenceLevel = getPreferenceLevel(layoutData.percentage);
                        const formattedLayout = layoutData.layout
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                        return (
                            <tr key={index} className="hover:bg-gray-50 border-b">
                                <td className="p-4 text-sm font-semibold">{formattedLayout}</td>
                                <td className="p-4 text-sm text-center font-semibold">{layoutData.count}</td>
                                <td className="p-4 text-sm text-center font-semibold">{layoutData.percentage}%</td>
                                <td className="p-4 text-sm text-center">{layoutData.totalResponses}</td>
                                <td className="p-4">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPopularityBadgeClass(preferenceLevel)}`}>
                                        {preferenceLevel}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Service Table Component
const ServiceTable: React.FC<{ data: ServiceData[] }> = ({ data }) => {
    if (data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No services match the current filters
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Service</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Category</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">High %</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Medium %</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Low %</th>
                        <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase border-b">Not Important %</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase border-b">Priority Level</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((service, index) => {
                        const priorityLevel = getPriorityLevel(service.high);
                        let displayServiceName = service.cleanDisplayName;
                        if (service.categories.length > 1) {
                            displayServiceName = `${displayServiceName} (${service.categories.join(', ')})`;
                        }

                        return (
                            <tr key={index} className="hover:bg-gray-50 border-b">
                                <td className="p-4 text-sm font-semibold">{displayServiceName}</td>
                                <td className="p-4">
                                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                        {service.categories.join(', ')}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-center font-semibold">{service.high}%</td>
                                <td className="p-4 text-sm text-center">{service.medium}%</td>
                                <td className="p-4 text-sm text-center">{service.low}%</td>
                                <td className="p-4 text-sm text-center">{service.notImportant}%</td>
                                <td className="p-4">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeClass(priorityLevel)}`}>
                                        {priorityLevel}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Helper functions for badge styling
function getPreferenceLevel(percentage: number): string {
    if (percentage >= 70) return 'Very High';
    if (percentage >= 50) return 'High';
    if (percentage >= 30) return 'Medium';
    return 'Low';
}

function getPopularityBadgeClass(level: string): string {
    switch (level) {
        case 'Very High':
            return 'bg-green-100 text-green-800';
        case 'High':
            return 'bg-blue-100 text-blue-800';
        case 'Medium':
            return 'bg-yellow-100 text-yellow-800';
        case 'Low':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getPriorityBadgeClass(level: string): string {
    switch (level) {
        case 'High':
            return 'bg-green-100 text-green-800';
        case 'Medium':
            return 'bg-orange-100 text-orange-800';
        case 'Low':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}