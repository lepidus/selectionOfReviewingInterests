{capture assign=optionsConfigurationUrl}{url router=$smarty.const.ROUTE_COMPONENT component="plugins.generic.selectionOfReviewingInterests.controllers.grid.SelectionOfReviewingInterestsGridHandler" op="fetchGrid" escape=false}{/capture}
{load_url_in_div id="rankingConfigurationGridContainer" url=$optionsConfigurationUrl}
