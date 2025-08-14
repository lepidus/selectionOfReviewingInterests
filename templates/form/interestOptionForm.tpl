<script>
    $(function() {
        $('#InterestOptionForm').pkpHandler('$.pkp.controllers.form.AjaxFormHandler');
    });
</script>

<div id="InterestOption">
    <form class="pkp_form" id="InterestOptionForm" method="post"
        action="{url router=$smarty.const.ROUTE_COMPONENT component="plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridHandler" op="updateOption" optionId=$optionId}">
        {csrf}

        {include file="controllers/notification/inPlaceNotification.tpl" notificationId="InterestOptionFormNotification"}

        {fbvFormArea id="interestOptionForm"}
            {fbvFormSection label="plugins.generic.selectionOfReviewingInterests.form.optionName"}
                {fbvElement type="textarea" id="optionName" value=$optionName size=$fbvStyles.size.MEDIUM}
            {/fbvFormSection}

            {fbvFormButtons submitText="common.save"}
        {/fbvFormArea}
    </form>
</div>
