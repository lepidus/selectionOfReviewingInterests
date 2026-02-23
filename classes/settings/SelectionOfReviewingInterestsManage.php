<?php

namespace APP\plugins\generic\selectionOfReviewingInterests\classes\settings;

use APP\notification\NotificationManager;
use PKP\core\JSONMessage;
use PKP\notification\Notification;

class SelectionOfReviewingInterestsManage
{
    public $plugin;

    public function __construct($plugin)
    {
        $this->plugin = $plugin;
    }

    public function execute($args, $request): JSONMessage
    {
        $user = $request->getUser();
        $notificationManager = new NotificationManager();

        switch ($request->getUserVar('verb')) {
            case 'settings':
                $context = $request->getContext();
                $form = new SelectionOptionsForm($this->plugin, $context->getId());
                $form->initData();

                if ($request->getUserVar('save')) {
                    $form->readInputData();
                    if ($form->validate()) {
                        $form->execute();
                        $notificationManager->createTrivialNotification($user->getId(), Notification::NOTIFICATION_TYPE_SUCCESS);
                        return new JSONMessage(true);
                    }
                }

                return new JSONMessage(true, $form->fetch($request));
            default:
                return $this->plugin->manage($args, $request);
        }
    }
}
