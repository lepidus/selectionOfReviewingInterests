{**
 * templates/user/interestsInput.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2000-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Keyword input control for user interests
 *}
<script>
    $(document).ready(function(){ldelim}
        $("#customInterests").find(".interests").tagit({ldelim}
            fieldName: 'interests[]',
            availableTags: $.pkp.plugins.generic.selectionOfReviewingInterests.interestsOptions,
            allowSpaces: true,
            autocomplete: {ldelim}
                delay: 0,
                minLength: 0 
            {rdelim},
            beforeTagAdded: function(event, ui) {ldelim}
                let availableTags = $("#customInterests").find(".interests").tagit("option", "availableTags");
                console.log("Available tags: " + availableTags);
                let tagAllowed = $.map(availableTags, function(tag) {ldelim}
                    return tag.toLowerCase();
                {rdelim}).indexOf(ui.tagLabel.toLowerCase()) !== -1;

                return tagAllowed;
            {rdelim}
        {rdelim});

        $(document).on('focus click', '.tagit-new input', function() {ldelim}
            $(this).autocomplete("search", "");
        {rdelim});
    {rdelim});
</script>

<div id="customInterests">
    <!-- The container which will be processed by tag-it.js as the interests widget -->
    <ul class="interests">
        {if $FBV_interests}{foreach from=$FBV_interests item=interest}<li class="hidden">{$interest|escape}</li>{/foreach}{/if}
    </ul>
    {if $FBV_label_content}<span>{$FBV_label_content}</span>{/if}
</div>