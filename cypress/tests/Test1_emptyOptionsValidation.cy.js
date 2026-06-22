describe('Reviewers can use OJS when no reviewing interest options are configured', function () {
    const notificationText = 'You must select at least one reviewing interest in the "Roles" tab before you can access the system.';

    it('Reviewer without interests accesses the dashboard while the plugin has no options', function () {
        cy.login('agallego', null, 'publicknowledge');

        cy.location('pathname').should('include', '/index.php/publicknowledge/submissions');
        cy.contains('.pkpNotification', notificationText).should('not.exist');
        cy.get('.app__pageHeading').contains('Submissions').should('be.visible');
    });
});
