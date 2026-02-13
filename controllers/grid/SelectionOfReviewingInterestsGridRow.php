<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\controllers\grid;

use PKP\controllers\grid\GridRow;
use PKP\linkAction\LinkAction;
use PKP\linkAction\request\AjaxModal;
use PKP\linkAction\request\RemoteActionConfirmationModal;

class SelectionOfReviewingInterestsGridRow extends GridRow
{
    public function initialize($request, $template = null)
    {
        parent::initialize($request, $template);
        $rowData = $this->getData();

        $optionId = $rowData['id'];
        $router = $request->getRouter();

        $this->addAction(
            new LinkAction(
                'editOption',
                new AjaxModal(
                    $router->url(
                        $request,
                        null,
                        null,
                        'editOption',
                        null,
                        ['optionId' => $optionId]
                    ),
                    __('grid.action.edit'),
                    'modal_edit',
                    true
                ),
                __('grid.action.edit'),
                'edit'
            )
        );

        $this->addAction(
            new LinkAction(
                'deleteOption',
                new RemoteActionConfirmationModal(
                    $request->getSession(),
                    __('common.confirmDelete'),
                    __('grid.action.delete'),
                    $router->url(
                        $request,
                        null,
                        null,
                        'deleteOption',
                        null,
                        ['optionId' => $optionId]
                    ),
                    'modal_delete'
                ),
                __('grid.action.delete'),
                'delete'
            )
        );
    }
}
