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
		const legacyInterest = 'Custom Research Topic';
		const invalidInterestMessage = 'Select only the predefined reviewing interests.';
		const firstJournalInterest = 'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade';
		const secondJournalInterest = 'Exclusive interest configured for the second journal';

		cy.login('agallego', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-choice').contains(legacyInterest).should('be.visible');
		cy.get('.interests .tagit-choice').contains('Estudos teóricos').should('be.visible');

		cy.contains('.interests .tagit-choice', legacyInterest)
			.find('.tagit-close')
			.click();
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-choice').contains(legacyInterest).should('not.exist');

		cy.get('#rolesForm').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: legacyInterest
			}).appendTo($form);
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.contains(invalidInterestMessage).should('be.visible');

		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-choice').contains(legacyInterest).should('not.exist');

		cy.logout();
		cy.login('dbarnes', null, secondJournalPath);
		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-new input').type('Manager Legacy Topic', {delay: 0});
		cy.get('.interests .tagit-new input').type('{enter}');
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.logout();
		cy.login('admin', 'admin', secondJournalPath);
		cy.get('nav').contains('Settings').click();
		cy.get('nav').contains('Website').click({force: true});
		cy.get('button[id="plugins-button"]').click();
		cy.get('input[id^=select-cell-selectionofreviewinginterests]').check();

		const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';
		cy.get('tr#' + pluginRowId + ' a.show_extras').click();
		cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
		cy.waitJQuery();
		cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-interestoptionsgrid-addOption-button-]')
			.contains('Add option')
			.click();
		cy.wait(1000);
		cy.get('input[id^=optionName-]').clear().type(secondJournalInterest, {delay: 0});
		cy.get('#interestOptionForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
		cy.contains('tr.gridRow', secondJournalInterest).should('exist');

		cy.logout();
		cy.login('sorisecurityregistration', 'SoriSecurityRegistration123!', secondJournalPath);
		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('#rolesForm').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: firstJournalInterest
			}).appendTo($form);
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.contains(invalidInterestMessage).should('be.visible');

		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-new input').type(secondJournalInterest, {delay: 0});
		cy.get('.interests .tagit-new input').type('{enter}');
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-label').contains(secondJournalInterest).should('exist');
		cy.get('.interests .tagit-label').contains(firstJournalInterest).should('not.exist');
	});
});
