<?php

import('lib.pkp.classes.controllers.grid.GridCellProvider');
import('lib.pkp.classes.linkAction.LinkAction');
import('lib.pkp.classes.linkAction.request.AjaxAction');

class SelectionOfReviewingInterestsGridCellProvider extends GridCellProvider
{
    public function getTemplateVarsFromRowColumn($row, $column)
    {
        $option = $row->getData();
        $columnId = $column->getId();

        switch ($columnId) {
            case 'option':
                return array('label' => $option['option']);
            default:
                break;
        }

        return parent::getTemplateVarsFromRowColumn($row, $column);
    }
}
