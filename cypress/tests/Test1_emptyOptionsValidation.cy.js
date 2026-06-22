describe('Reviewers can use OJS when no reviewing interest options are configured', function () {
    const notificationText = 'You must select at least one reviewing interest in the "Roles" tab before you can access the system.';

    it('Reviewer without interests accesses the dashboard while the plugin has no options', function () {
        cy.login('agallego', null, 'publicknowledge');

        cy.url().should('include', '/dashboard');
        cy.contains('.pkpNotification', notificationText).should('not.exist');

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.url().should('include', '/dashboard');
        cy.contains('.pkpNotification', notificationText).should('not.exist');
    });
});
