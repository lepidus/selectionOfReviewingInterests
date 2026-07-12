describe('Accessing profile from other contexts works normally', function () {
	const secondJournalPath = 'secondjournal';

	it('Creates a second journal', function () {
		cy.login('admin', 'admin');
		cy.visit('/index.php/index/admin/contexts');
		cy.get('div[id=contextGridContainer]').find('a').contains('Create').click();

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

		cy.contains('Settings Wizard');
	});

	it('Reviewer accesses profile from the second journal without plugin interference', function () {
		cy.login('agallego', null, secondJournalPath);

		cy.visit('index.php/' + secondJournalPath + '/en/user/profile');
		cy.get('#profileTabs').should('be.visible');

		cy.get('.pkpNotification').should('not.exist');

		cy.get('a[name="roles"]').click();
		cy.waitJQuery();

		cy.get('#interests').should('be.visible');
		cy.get('.interests .tagit-choice').should('have.length.at.least', 1);

		cy.get('input[id^="reviewerGroup-"]').first().check();
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
	});

	it('Reviewer can navigate to dashboard from the second journal', function () {
		cy.login('agallego', null, secondJournalPath);
		cy.url().should('include', '/dashboard');

		cy.get('.pkpNotification').should('not.exist');
		cy.logout();
	});

	it('Reviewer adds a free-text interest from the second journal', function () {
		cy.login('agallego', null, secondJournalPath);
		cy.visit('index.php/' + secondJournalPath + '/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-new input').type('Custom Research Topic', {delay: 0});
		cy.get('.interests .tagit-new input').type('{enter}');
		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('exist');
		cy.get('.interests .tagit-new input').type('Administrative Legacy Topic', {delay: 0});
		cy.get('.interests .tagit-new input').type('{enter}');
		cy.get('.interests .tagit-choice').contains('Administrative Legacy Topic').should('exist');

		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
	});

	it('Free-text interests from other journals are displayed in journal with plugin', function () {
		cy.login('agallego', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Administrative Legacy Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Estudos teóricos').should('be.visible');
	});

	it('Free-text interests are preserved after saving form in journal with plugin', function () {
		cy.login('agallego', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();

		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Administrative Legacy Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Estudos teóricos').should('be.visible');

		cy.get('.interests .tagit-choice')
			.contains('Custom Research Topic')
			.closest('.tagit-choice')
			.find('.tagit-close')
			.click({force: true});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('not.exist');

		cy.get('#rolesForm').then(($form) => {
			$form.append('<input type="hidden" name="interests[]" value="Custom Research Topic">');
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
		cy.contains(
			'Select only reviewing interests configured for this journal. Previously saved interests may be preserved.'
		).should('be.visible');

		cy.visit('index.php/publicknowledge/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('not.exist');
	});
});
