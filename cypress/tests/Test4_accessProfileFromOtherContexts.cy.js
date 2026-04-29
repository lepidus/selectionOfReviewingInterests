describe('Accessing profile from other contexts works normally', function () {
	const secondJournalPath = 'secondjournal';

	it('Creates a second journal', function () {
		cy.login('admin', 'admin');
		cy.visit('/index.php/index/admin/contexts');
		cy.get('div[id=contextGridContainer]').find('a').contains('Create').click();

		cy.wait(1000); // Wait for the modal to open
		cy.get('input[name="name-en"]').type('Second Journal', {delay: 0});
		cy.get('input[name=acronym-en]').type('SJ', {delay: 0});
		cy.get('span').contains('Enable this journal').siblings('input').check();
		cy.get('input[name="supportedLocales"][value="en"]').check();
		cy.get('input[name="primaryLocale"][value="en"]').check();
		cy.get('select[id=context-country-control]').select('Iceland');
		cy.get('input[name=contactName]').type('Test Contact', {delay: 0});
		cy.get('input[name=contactEmail]').type('test@mailinator.com', {delay: 0});
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
		cy.logout();
	});

	it('Reviewer adds a free-text interest from the second journal', function () {
		cy.login('agallego', null, secondJournalPath);
		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-new input').type('Custom Research Topic', {delay: 0});
		cy.get('.interests .tagit-new input').type('{enter}');
		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('exist');

		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
	});

	it('Free-text interests from other journals are displayed in journal with plugin', function () {
		cy.login('agallego', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Estudos teóricos').should('be.visible');
	});

	it('Free-text interests are preserved after saving form in journal with plugin', function () {
		cy.login('agallego', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Estudos teóricos').should('be.visible');
	});
});
