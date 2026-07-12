describe('Reviewer interest filter uses interests edited from Users & Roles', function () {
	const reviewerName = 'Paul Hudson';
	const reviewerUsername = 'phudson';
	const reviewingInterest = 'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico';
	const submissionTitle = 'Condensing Water Availability Models to Focus on Specific Water Management Systems';
	const managerLegacyInterest = 'Manager Legacy Topic';
	const secondJournalInterest = 'Exclusive interest configured for the second journal';

	function openUserSearchFilter() {
		cy.get('#userGridContainer').within(() => {
			cy.get('.pkp_linkaction_search').click();
			cy.get('form#userSearchForm').should('be.visible');
		});
	}

	function openUserEditForm(username) {
		cy.get('.app__nav a:contains("Users & Roles")').click();
		cy.waitJQuery();

		openUserSearchFilter();

		cy.intercept('POST', '**/grid/settings/user/user-grid/fetch-grid*').as('usersFiltered');
		cy.get('form#userSearchForm:visible input[name="search"]').clear().type(username, {delay: 0});
		cy.get('form#userSearchForm:visible button[id^="submitFormButton"]').click();
		cy.wait('@usersFiltered').its('response.statusCode').should('eq', 200);
		cy.waitJQuery();

		cy.contains('tr.gridRow', username).as('userRow');
		cy.get('@userRow').find('a.show_extras').click();
		cy.get('@userRow').invoke('attr', 'id').then((rowId) => {
			cy.get('#' + Cypress.$.escapeSelector(rowId + '-control-row'))
				.find('a[id*="-edit-button-"]')
				.click();
		});
		cy.waitJQuery();
		cy.get('#userDetailsForm').should('exist');
	}

	function selectReviewingInterestIfMissing(interest) {
		cy.contains('#userDetailsForm a.toggleExtras', 'More User Details')
			.scrollIntoView()
			.click();
		cy.get('#userExtras .interests').scrollIntoView().should('be.visible').then(($interests) => {
			const alreadySelected = $interests
				.find('.tagit-label')
				.toArray()
				.some((label) => Cypress.$(label).text().trim() === interest);

			if (alreadySelected) {
				return;
			}

			cy.get('#userExtras .interests .tagit-new input')
				.scrollIntoView()
				.as('interestInput')
				.click()
				.then(($input) => {
					$input.autocomplete('search', '');
					const autocompleteId = $input.autocomplete('widget').attr('id');

					cy.get('#' + Cypress.$.escapeSelector(autocompleteId))
						.should('be.visible')
						.contains('li.ui-menu-item:visible', interest)
						.should('be.visible');
				});
			cy.get('@interestInput').type('{downarrow}{enter}');

			cy.get('#userExtras .interests .tagit-label').contains(interest).should('exist');
		});
	}

	function saveUserDetails() {
		cy.intercept('POST', '**/grid/settings/user/user-grid/update-user*').as('userSaved');
		cy.get('form#userDetailsForm button[id^="submitFormButton"]')
			.scrollIntoView()
			.click();
		cy.wait('@userSaved').its('response.statusCode').should('eq', 200);
		cy.waitJQuery();
	}

	function openAddReviewerForSubmission(title) {
		cy.visit('index.php/publicknowledge/submissions');
		cy.get('button[id="active-button"]').click();
		cy.contains('#active .listPanel__itemTitle:visible, #active .listPanel__itemSubtitle:visible', title)
			.parents('.listPanel__item')
			.first()
			.within(() => {
				cy.get('.pkpButton:contains("View")').click();
			});

		cy.get('a:contains("Add Reviewer")').click();
		cy.waitJQuery();
		cy.get('.listPanel--selectReviewer').should('be.visible');
	}

	function filterReviewersByInterest(interest) {
		cy.get('.listPanel--selectReviewer button:contains("Filter")').click();
		cy.contains('.listPanel--selectReviewer .pkpFilter--checkboxes label', interest)
			.scrollIntoView()
			.as('interestFilter')
			.click();
		cy.get('@interestFilter')
			.find('input[type="checkbox"]')
			.should('be.checked');
		cy.waitJQuery();
	}

	function openPluginConfiguration() {
		cy.get('nav').contains('Settings').click();
		cy.get('nav').contains('Website').click({force: true});
		cy.get('button[id="plugins-button"]').click();

		const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';
		cy.get('tr#' + pluginRowId + ' a.show_extras').click();
		cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
		cy.waitJQuery();
	}

	function assertDeletionForbiddenForUser(username, password, remoteAction) {
		cy.logout();
		cy.login(username, password, 'publicknowledge');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('input[name="csrfToken"]').first().invoke('val').then((csrfToken) => {
			cy.request({
				method: 'POST',
				url: remoteAction,
				body: {csrfToken},
				form: true,
				failOnStatusCode: false
			}).then((response) => {
				expect(response.body.status).not.to.eq(true);
			});
		});
	}

	it('shows Paul Hudson in Add Reviewer when filtering by the selected interest', function () {
		cy.login('dbarnes', null, 'publicknowledge');

		openUserEditForm(reviewerUsername);
		selectReviewingInterestIfMissing(reviewingInterest);
		saveUserDetails();

		openUserEditForm(reviewerUsername);
		cy.get('#userDetailsForm').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: managerLegacyInterest
			}).appendTo($form);
		});
		cy.intercept('POST', '**/grid/settings/user/user-grid/update-user*').as('invalidUserSave');
		cy.get('form#userDetailsForm button[id^="submitFormButton"]')
			.scrollIntoView()
			.click();
		cy.wait('@invalidUserSave').then(({response}) => {
			expect(response.statusCode).to.eq(200);
			expect(response.body.status).to.eq(false);
		});

		openUserEditForm(reviewerUsername);
		cy.get('#userExtras .interests .tagit-label')
			.contains(managerLegacyInterest)
			.should('not.exist');
		cy.get('#userExtras .interests .tagit-label')
			.contains(reviewingInterest)
			.should('exist');

		openAddReviewerForSubmission(submissionTitle);
		filterReviewersByInterest(reviewingInterest);

		cy.contains(reviewerName);

		cy.logout();
		cy.login('admin', 'admin', 'secondjournal');
		cy.visit('index.php/secondjournal/submissions');
		openPluginConfiguration();
		cy.contains('tr.gridRow', secondJournalInterest)
			.find('a[id*="-deleteOption-button-"]')
			.then(($deleteLink) => {
				const handler = Cypress.$.pkp.classes.Handler.getHandler($deleteLink);
				const remoteAction = handler.linkActionRequest_.getOptions().remoteAction;
				const foreignOptionId = new URL(remoteAction).searchParams.get('optionId');
				expect(foreignOptionId).to.match(/^[a-f0-9]{13}$/);
				cy.wrap(foreignOptionId).as('foreignOptionId');
			});

		cy.logout();
		cy.login('dbarnes', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/submissions');
		openPluginConfiguration();
		cy.contains('tr.gridRow', reviewingInterest)
			.find('a[id*="-deleteOption-button-"]')
			.then(($deleteLink) => {
				const handler = Cypress.$.pkp.classes.Handler.getHandler($deleteLink);
				const requestOptions = handler.linkActionRequest_.getOptions();
				const remoteAction = requestOptions.remoteAction;
				const csrfToken = requestOptions.csrfToken;

				cy.get('@foreignOptionId').then((foreignOptionId) => {
					const foreignIdOnCurrentContextUrl = new URL(remoteAction);
					foreignIdOnCurrentContextUrl.searchParams.set('optionId', foreignOptionId);
					cy.request({
						method: 'POST',
						url: foreignIdOnCurrentContextUrl.toString(),
						body: {csrfToken},
						form: true,
						failOnStatusCode: false
					}).its('body.status').should('eq', false);
				});

				assertDeletionForbiddenForUser('asmecher', null, remoteAction);
				assertDeletionForbiddenForUser('agallego', null, remoteAction);
				assertDeletionForbiddenForUser(
					'sorisecurityregistration',
					'SoriSecurityRegistration123!',
					remoteAction
				);
			});

		cy.logout();
		cy.login('admin', 'admin', 'secondjournal');
		cy.visit('index.php/secondjournal/submissions');
		openPluginConfiguration();
		cy.contains('tr.gridRow', secondJournalInterest).should('exist');

		cy.logout();
		cy.login('dbarnes', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/submissions');
		openPluginConfiguration();
		cy.contains('tr.gridRow', reviewingInterest).should('exist');
	});
});
