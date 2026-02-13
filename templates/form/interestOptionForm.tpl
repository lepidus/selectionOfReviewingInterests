<script>
    $(function() {
        $('#InterestOptionForm').pkpHandler('$.pkp.controllers.form.AjaxFormHandler');
    });
</script>

<div id="InterestOption">
    {assign var="actionUrl" value={url router=$smarty.const.ROUTE_COMPONENT component="plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridHandler" op="updateOption"}}
    {if $optionId}
        {assign var="actionUrl" value={url router=$smarty.const.ROUTE_COMPONENT component="plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridHandler" op="updateOption" optionId=$optionId}}
    {/if}
    <form class="pkp_form" id="InterestOptionForm" method="post" action="{$actionUrl}">
        {csrf}

        {include file="controllers/notification/inPlaceNotification.tpl" notificationId="InterestOptionFormNotification"}

        {fbvFormArea id="interestOptionForm"}
            {fbvFormSection label="plugins.generic.selectionOfReviewingInterests.configuration.form.optionText"}
                <p class="pkp_help">{translate key="plugins.generic.selectionOfReviewingInterests.configuration.form.optionText.description"}</p>
                {fbvElement type="text" id="optionName" value=$optionName size=$fbvStyles.size.MEDIUM}
            {/fbvFormSection}

            {fbvFormButtons submitText="common.save"}
        {/fbvFormArea}
    </form>
</div>
