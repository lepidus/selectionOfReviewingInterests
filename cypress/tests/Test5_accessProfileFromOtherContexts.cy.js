describe('Accessing profile from other contexts works normally', function () {
	const secondJournalPath = 'secondjournal';
	const secondJournalOption = 'Second journal configured interest';
	const mainJournalOption = 'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade';
	const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';

	function openSecondJournalPluginSettings() {
		cy.visit('/index.php/index/admin/contexts');
		cy.get('#contextGridContainer')
			.contains('tr', 'Second Journal')
			.as('secondJournalRow');
		cy.get('@secondJournalRow').find('a.show_extras').click({force: true});
		cy.get('@secondJournalRow')
			.next('tr.row_controls')
			.contains('Settings wizard')
			.click({force: true});
		cy.get('button#plugins-button').click();
		cy.get('input[id^=select-cell-selectionofreviewinginterests]').then(($checkbox) => {
			if (!$checkbox.is(':checked')) {
				cy.wrap($checkbox).check();
			}
		});
		cy.get('tr#' + pluginRowId + ' a.show_extras').click();
		cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
		cy.waitJQuery();
	}

	function openMainJournalPluginSettings() {
		cy.visit('/index.php/publicknowledge/en/management/settings/website#plugins');
		cy.get('button#plugins-button').click();
		cy.get('tr#' + pluginRowId + ' a.show_extras').click();
		cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
		cy.waitJQuery();
	}

	function getDeleteRequestForOption(optionText) {
		return cy.contains('tr', optionText).then(($row) => {
			const rowId = $row.attr('id');
			cy.wrap($row).find('a.show_extras').click({force: true});
			return cy.get('#' + rowId + '-control-row')
				.contains('a', 'Delete')
				.then(($deleteLink) => {
					const request = $deleteLink.data('pkp.handler').linkActionRequest_;
					cy.wrap($deleteLink).click({force: true});
					return cy.then(() => {
						const modalHandler = request.$modal_.data('pkp.handler');
						const deleteRequest = {
							url: modalHandler.remoteAction_,
							csrfToken: modalHandler.postData_.csrfToken,
						};
						modalHandler.modalClose();
						return deleteRequest;
					});
				});
		});
	}

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

		cy.get('.interests').should('contain.text', 'Custom Research Topic');
		cy.get('.interests').should('contain.text', 'Administrative Legacy Topic');
		cy.get('.interests').should('contain.text', 'Estudos teóricos');
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

		cy.get('.interests').should('contain.text', 'Custom Research Topic');
		cy.get('.interests').should('contain.text', 'Administrative Legacy Topic');
		cy.get('.interests').should('contain.text', 'Estudos teóricos');

		cy.get('.interests li')
			.filter((index, item) => Cypress.$(item).text().trim() === 'Custom Research Topic')
			.then(($item) => $item.remove());
		cy.get('input[name="interests[]"][value="Custom Research Topic"]')
			.then(($input) => $input.remove());
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();
		cy.get('.interests').should('not.contain.text', 'Custom Research Topic');
		cy.get('input[name="interests[]"][value="Custom Research Topic"]').should('not.exist');

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
		cy.get('.interests').should('not.contain.text', 'Custom Research Topic');
		cy.get('input[name="interests[]"][value="Custom Research Topic"]').should('not.exist');

		let secondDeleteRequest;

		cy.login('admin', 'admin');
		openSecondJournalPluginSettings();
		cy.get('body').then(($body) => {
			if ($body.find('tr:contains("' + secondJournalOption + '")').length) {
				return;
			}

			cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-interestoptionsgrid-addOption-button-]')
				.contains('Add option')
				.click();
			cy.get('input[id^=optionName-]').clear().type(secondJournalOption);
			cy.get('#interestOptionForm > .formButtons > button[id^=submitFormButton]').click();
			cy.waitJQuery();
		});
		cy.contains(secondJournalOption).should('exist');
		getDeleteRequestForOption(secondJournalOption).then((request) => {
			secondDeleteRequest = request;
		});
		cy.logout();

		cy.login('cmontgomerie', null, secondJournalPath);
		cy.visit('/index.php/' + secondJournalPath + '/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();
		cy.get('#rolesForm').then(($form) => {
			$form.append('<input type="hidden" name="interests[]" value="' + secondJournalOption + '">');
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
		cy.visit('/index.php/' + secondJournalPath + '/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();
		cy.get('.interests').should('contain.text', secondJournalOption);

		cy.get('#rolesForm').then(($form) => {
			$form.append('<input data-cy="main-context-interest" type="hidden" name="interests[]" value="' + mainJournalOption + '">');
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
		cy.contains(
			'Select only reviewing interests configured for this journal. Previously saved interests may be preserved.'
		).should('be.visible');
		cy.visit('/index.php/' + secondJournalPath + '/en/user/profile');
		cy.get('a[name="roles"]').click();
		cy.waitJQuery();
		cy.get('.interests').should('not.contain.text', mainJournalOption);
		cy.get('.interests').should('contain.text', secondJournalOption);
		cy.logout();

		cy.login('dbarnes', null, 'publicknowledge');
		openMainJournalPluginSettings();
		getDeleteRequestForOption(mainJournalOption).then((mainDeleteRequest) => {
			const crossContextUrl = new URL(mainDeleteRequest.url);
			const secondContextUrl = new URL(secondDeleteRequest.url);
			crossContextUrl.searchParams.set('optionId', secondContextUrl.searchParams.get('optionId'));

			cy.request({
				method: 'POST',
				url: crossContextUrl.toString(),
				body: {csrfToken: mainDeleteRequest.csrfToken},
				form: true,
			}).its('body.status').should('eq', false);
		});
		cy.logout();

		cy.login('admin', 'admin');
		openSecondJournalPluginSettings();
		cy.contains(secondJournalOption).should('exist');
	});
});
