<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes;

use APP\core\Application;
use APP\plugins\generic\selectionOfReviewingInterests\SelectionOfReviewingInterestsPlugin;
use PKP\db\DAORegistry;

class InterestFilterHelper
{
    private SelectionOfReviewingInterestsPlugin $plugin;

    public function __construct(SelectionOfReviewingInterestsPlugin $plugin)
    {
        $this->plugin = $plugin;
    }

    /**
     * Get configured interests for a context
     * 
     * @param int $contextId Journal/Press context ID
     * @return array Associative array of [id => name]
     */
    public function getConfiguredInterests(int $contextId): array
    {
        $interestOptions = $this->plugin->getSetting($contextId, 'interestOptions');
        
        if (!is_array($interestOptions)) {
            return [];
        }

        return $interestOptions;
    }

    /**
     * Get controlled vocabulary entry IDs for interests
     * Maps plugin's interest options to OJS controlled vocabulary entries
     * 
     * @param int $contextId Journal/Press context ID
     * @return array Array of controlled vocab entry IDs
     */
    public function getInterestControlledVocabIds(int $contextId): array
    {
        $interests = $this->getConfiguredInterests($contextId);
        $entryIds = [];

        if (empty($interests)) {
            return [];
        }

        // Get the controlled vocab for interests
        $vocabDao = DAORegistry::getDAO('ControlledVocabDAO');
        $vocab = $vocabDao->getBySymbolic('interest');

        if (!$vocab) {
            return [];
        }

        // Get all entries for this vocab
        $entryDao = DAORegistry::getDAO('ControlledVocabEntryDAO');
        $entries = $entryDao->getByVocabId($vocab->getId());

        // Map interest names to their controlled vocab entry IDs
        while ($entry = $entries->next()) {
            $settings = $entry->getSettings();
            $interestName = $settings['interest'] ?? $settings['name'] ?? null;

            // Check if this entry matches any configured interest
            foreach ($interests as $id => $name) {
                if ($interestName && strtolower($interestName) === strtolower($name)) {
                    $entryIds[$id] = $entry->getId();
                    break;
                }
            }
        }

        return $entryIds;
    }

    /**
     * Build filter configuration for SelectReviewerListPanel
     * 
     * @param int $contextId Journal/Press context ID
     * @return array|null Filter configuration or null if no interests
     */
    public function buildFilterConfig(int $contextId): ?array
    {
        $interests = $this->getConfiguredInterests($contextId);

        if (empty($interests)) {
            return null;
        }

        // Get mapping of interest names to controlled vocab IDs
        $entryIds = $this->getInterestControlledVocabIds($contextId);

        // Build options array with controlled vocab IDs as keys
        $options = [];
        foreach ($interests as $id => $name) {
            // Use the controlled vocab entry ID if available, otherwise use plugin ID
            $key = $entryIds[$id] ?? $id;
            $options[$key] = $name;
        }

        return [
            'param' => 'interestEntryIds',
            'title' => __('plugins.generic.selectionOfReviewingInterests.reviewerSelection.filterLabel'),
            'filterType' => 'filter-select',
            'options' => $options,
            'isMultiselect' => true,
        ];
    }

    /**
     * Parse interest IDs from request query parameter
     * Validates and returns array of interest IDs
     * 
     * @param mixed $input Raw input from query parameter (comma-separated string or array)
     * @return array Validated array of interest IDs
     */
    public function parseInterestIdsFromRequest($input): array
    {
        if (is_null($input) || $input === '' || $input === []) {
            return [];
        }

        // Convert to array if string
        if (is_string($input)) {
            $ids = explode(',', $input);
        } else {
            $ids = (array) $input;
        }

        // Filter and validate: keep only numeric IDs
        return array_filter(
            array_map('intval', $ids),
            function ($id) {
                return $id > 0;
            }
        );
    }

    /**
     * Get all interest entry IDs mapped to their configured names
     * Used for validation and filtering
     * 
     * @param int $contextId Journal/Press context ID
     * @return array Mapping of controlled vocab entry ID => interest name
     */
    public function getAllInterestEntryIds(int $contextId): array
    {
        return $this->getInterestControlledVocabIds($contextId);
    }
}
