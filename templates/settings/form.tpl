<div id="description">
	<p>{translate key="plugins.generic.selectionOfReviewingInterests.configuration.description"}</p>
</div>

{capture assign=optionsConfigurationUrl}{url router=$smarty.const.ROUTE_COMPONENT component="plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridHandler" op="fetchGrid" escape=false}{/capture}
{load_url_in_div id="interestOptionsConfigurationGridContainer" url=$optionsConfigurationUrl}
