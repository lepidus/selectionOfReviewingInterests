/**
 * reviewerSelectionInterestFilter.js
 * 
 * Extends the SelectReviewerListPanel with interests filter functionality
 * Injects a new filter for reviewing interests that is already configured in the plugin
 */

(function() {
    'use strict';

    // Wait for the Vue app to be ready
    $(document).ready(function() {
        // Check if we have the reviewing interests options injected
        if (!$.pkp.plugins.generic.selectionOfReviewingInterests ||
            !$.pkp.plugins.generic.selectionOfReviewingInterests.reviewingInterestOptions) {
            return;
        }

        const interestOptions = $.pkp.plugins.generic.selectionOfReviewingInterests.reviewingInterestOptions;
        
        // If no interests are configured, don't proceed
        if (!interestOptions || Object.keys(interestOptions).length === 0) {
            return;
        }

        // Hook into the SelectReviewerListPanel Vue component initialization
        // We need to modify the component's config to include the interests filter
        
        // Store the original getConfig method if it exists
        const originalGetConfig = window.pkp?.registry?.get?.('AdvancedSearchReviewerContainer')?._registeredComponent?.getConfig;

        // Override the registry initialization to inject our filter
        if (window.pkp && window.pkp.registry) {
            const originalInit = window.pkp.registry.init;
            
            window.pkp.registry.init = function(id, component, props, el) {
                // If this is a SelectReviewerListPanel, inject the interests filter
                if (component === 'AdvancedSearchReviewerContainer' && props) {
                    // Initialize filters array if it doesn't exist
                    if (!props.filters) {
                        props.filters = [];
                    }

                    // Create the interests filter configuration
                    const interestFilter = {
                        param: 'interestEntryIds',
                        title: $.pkp.localeKeys && $.pkp.localeKeys['plugins.generic.selectionOfReviewingInterests.reviewerSelection.filterLabel'] || 
                               'Reviewing Interests',
                        filterType: 'filter-select',
                        options: interestOptions,
                        isMultiselect: true,
                        value: []
                    };

                    // Check if interests filter already exists
                    const filterExists = props.filters.some(f => f.param === 'interestEntryIds');
                    
                    if (!filterExists) {
                        // Add the interests filter to the filters array
                        props.filters.push(interestFilter);
                    }
                }

                // Call the original init method
                return originalInit.call(this, id, component, props, el);
            };
        }

        // Alternative approach: Hook into the ListPanel component's mounted lifecycle
        // This is a backup method in case the above doesn't work
        if (window.pkp && window.pkp.ListPanel) {
            const originalListPanelInit = window.pkp.ListPanel.methods?.mounted;
            
            if (originalListPanelInit) {
                window.pkp.ListPanel.methods.mounted = function() {
                    // Add interests filter if this is a SelectReviewerListPanel
                    if (this.$el && this.$el.id && this.$el.id.includes('select-reviewer')) {
                        if (!this.filters) {
                            this.$set(this, 'filters', []);
                        }

                        // Check if interests filter already exists
                        const filterExists = this.filters.some(f => f.param === 'interestEntryIds');
                        
                        if (!filterExists && Object.keys(interestOptions).length > 0) {
                            this.filters.push({
                                param: 'interestEntryIds',
                                title: 'Reviewing Interests',
                                filterType: 'filter-select',
                                options: interestOptions,
                                isMultiselect: true,
                                value: []
                            });
                        }
                    }

                    // Call original if it exists
                    if (originalListPanelInit) {
                        return originalListPanelInit.call(this);
                    }
                };
            }
        }
    });
})();
