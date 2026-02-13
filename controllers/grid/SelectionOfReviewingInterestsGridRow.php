<?php

import('lib.pkp.classes.controllers.grid.GridRow');
import('lib.pkp.classes.linkAction.request.AjaxModal');
import('lib.pkp.classes.linkAction.request.RemoteActionConfirmationModal');

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
                        array('optionId' => $optionId)
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
                        array('optionId' => $optionId)
                    ),
                    'modal_delete'
                ),
                __('grid.action.delete'),
                'delete'
            )
        );
    }
}
