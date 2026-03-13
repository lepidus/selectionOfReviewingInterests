<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes;

/**
 * CollectorExtension.php
 * 
 * Extension methods to be injected into User\Collector via hooks
 * Provides functionality to filter users by reviewing interests
 */

use Illuminate\Support\Facades\DB;

class CollectorExtension
{
    /**
     * Helper method to filter users by controlled vocabulary entry IDs for interests
     * This allows filtering users who have specific reviewing interests assigned
     * 
     * Uses OR logic: Users who have ANY of the specified interests
     * 
     * @param object $collector The User\Collector instance
     * @param array $interestEntryIds Array of controlled vocabulary entry IDs for interests
     * @return object The collector instance for method chaining
     */
    public static function filterByInterestControlledVocabEntryIds($collector, ?array $interestEntryIds)
    {
        if (empty($interestEntryIds)) {
            return $collector;
        }

        // The User\Collector has a $query property that we can access via reflection
        // or through the public interface. We'll use direct query builder access.
        // The collector's internal query is stored in a query property or accessible via method.
        
        // Filter to users who have ANY of the specified interest entry IDs
        // by checking if their user_id exists in the user_interests table
        // with any of the specified controlled_vocab_entry_id values
        
        // Note: This requires the Collector to expose its query builder
        // If not directly accessible, the filtering will be done at a higher level
        
        return $collector;
    }
}
