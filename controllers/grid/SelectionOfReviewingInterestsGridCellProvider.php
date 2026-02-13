<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\controllers\grid;

use PKP\controllers\grid\GridCellProvider;

class SelectionOfReviewingInterestsGridCellProvider extends GridCellProvider
{
    public function getTemplateVarsFromRowColumn($row, $column)
    {
        $option = $row->getData();
        $columnId = $column->getId();

        switch ($columnId) {
            case 'option':
                return ['label' => $option['option']];
            default:
                break;
        }

        return parent::getTemplateVarsFromRowColumn($row, $column);
    }
}
