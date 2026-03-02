describe('Accessing profile from other contexts works normally', function () {
	const secondJournalPath = 'secondjournal';

	it('Creates a second journal', function () {
		cy.login('admin', 'admin');
		cy.visit('/index.php/index/admin/contexts');
		cy.get('div[id=contextGridContainer]').find('a').contains('Create').click();

		cy.wait(1000); // Wait for the modal to open
		cy.get('input[name="name-en_US"]').type('Second Journal', {delay: 0});
		cy.get('input[name=acronym-en_US]').type('SJ', {delay: 0});
		cy.get('span').contains('Enable this journal').siblings('input').check();
		cy.get('input[name="supportedLocales"][value="en_US"]').check();
		cy.get('input[name="primaryLocale"][value="en_US"]').check();
		cy.get('input[name=urlPath]').clear().type(secondJournalPath, {delay: 0});
		cy.get('button').contains('Save').click();

		cy.contains('Settings Wizard', {timeout: 30000});
	});

	it('Reviewer accesses profile from the second journal without plugin interference', function () {
		cy.login('agallego', null, secondJournalPath);

		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').should('be.visible');

		cy.get('.pkpNotification').should('not.exist');

		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests').should('be.visible');
		cy.get('.interests .tagit-choice').should('have.length.at.least', 1);

		cy.get('input[id^="reviewerGroup-"]').first().check();
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
	});

	it('Reviewer can navigate to submissions from the second journal', function () {
		cy.login('agallego', null, secondJournalPath);
		cy.get('.app__pageHeading').contains('Submissions').should('be.visible');

		cy.get('.pkpNotification').should('not.exist');
	});
});
