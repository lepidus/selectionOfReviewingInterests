describe('Filtering reviewers by interests from Hosted Journals', function () {
	const interestOption = 'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade';
	const submissionTitle = 'Transformative Impact of AI Tools on Modern Education: Opportunities, Challenges, and Future Directions';

	function openPublicKnowledgeUsersFromHostedJournals() {
		cy.login('admin', 'admin');
		cy.visit('/index.php/index/admin/contexts');

		cy.get('#contextGridContainer')
			.contains('tr', Cypress.env('contextTitles').en)
			.as('journalRow');

		cy.get('@journalRow')
			.find('a.show_extras')
			.click({force: true});

		cy.get('@journalRow')
			.next('tr.row_controls')
			.contains('Settings wizard')
			.click({force: true});

		cy.get('button#users-button').click();
		cy.get('#userGridContainer').contains('phudson');
	}

	function removeReviewingInterests() {
		cy.get('#userDetailsForm #userExtras .interests').then(($interests) => {
			const closeButton = $interests.find('.tagit-choice .tagit-close').get(0);

			if (closeButton) {
				cy.wrap(closeButton).click({force: true});
				removeReviewingInterests();
			}
		});
	}

	function selectConfiguredInterest() {
		cy.contains('More User Details')
			.scrollIntoView()
			.click({force: true});

		cy.get('#userDetailsForm #userExtras .interests')
			.scrollIntoView()
			.should('exist');

		removeReviewingInterests();

		cy.get('#userDetailsForm #userExtras .interests .tagit-new input')
			.click({force: true})
			.then(($input) => {
				expect(
					$input.data('ui-autocomplete') || $input.data('autocomplete'),
					'reviewing interests autocomplete'
				).to.exist;

				$input.autocomplete('search', '');
			});

		cy.get('ul.ui-autocomplete:visible', {timeout: 10000})
			.contains('.ui-menu-item', interestOption)
			.click({force: true});

		cy.get('#userDetailsForm #userExtras .interests .tagit-label')
			.contains(interestOption)
			.should('exist');
	}

	function assignInterestToPaulHudson() {
		openPublicKnowledgeUsersFromHostedJournals();

		cy.get('#userGridContainer')
			.contains('tr', 'phudson')
			.as('paulHudsonRow');

		cy.get('@paulHudsonRow')
			.find('a.show_extras')
			.click({force: true});

		cy.get('@paulHudsonRow')
			.next('tr.row_controls')
			.contains('Edit')
			.click({force: true});

		cy.get('#userDetailsForm').should('exist');
		selectConfiguredInterest();
		cy.get('#userDetailsForm').then(($form) => {
			$form.append('<input data-cy="injected-admin-interest" type="hidden" name="interests[]" value="Injected admin interest">');
			cy.intercept('POST', $form.attr('action')).as('manipulatedAdminUpdate');
		});

		cy.get('#userDetailsForm button[id^=submitFormButton]')
			.scrollIntoView()
			.click({force: true});

		cy.waitJQuery();
		cy.wait('@manipulatedAdminUpdate').its('response.body.status').should('eq', false);
		cy.get('#userDetailsForm').should('exist');
		cy.get('[data-cy="injected-admin-interest"]').then(($input) => $input.remove());
		cy.get('#userDetailsForm button[id^=submitFormButton]')
			.scrollIntoView()
			.click({force: true});
		cy.waitJQuery();
		cy.logout();
	}

	function preserveEditedUsersLegacyInterest() {
		openPublicKnowledgeUsersFromHostedJournals();

		cy.get('#userGridContainer')
			.contains('tr', 'agallego')
			.as('adelaGallegoRow');

		cy.get('@adelaGallegoRow').find('a.show_extras').click({force: true});
		cy.get('@adelaGallegoRow')
			.next('tr.row_controls')
			.contains('Edit')
			.click({force: true});

		cy.get('#userDetailsForm #userExtras .interests .tagit-label')
			.contains('Administrative Legacy Topic')
			.should('exist');
		cy.get('#userDetailsForm').then(($form) => {
			cy.intercept('POST', $form.attr('action')).as('preserveEditedUserLegacy');
		});
		cy.get('#userDetailsForm button[id^=submitFormButton]').click({force: true});
		cy.wait('@preserveEditedUserLegacy').its('response.body.status').should('eq', true);
		cy.logout();
	}

	function filterReviewersByInterest() {
		cy.login('dbarnes', null, 'publicknowledge');

		cy.contains('table tr', submissionTitle)
			.contains('button', /^\s*View\s*$/)
			.scrollIntoView()
			.should('be.visible')
			.click({force: true});

		cy.get('[data-cy="reviewer-manager"]')
			.find('button')
			.contains('Add Reviewer')
			.click({force: true});

		cy.get('.pkpHeader__actions .pkpButton')
			.click({force: true});

		cy.contains('.pkpFilter--checkboxes label', interestOption)
			.find('input')
			.check({force: true});

		cy.contains('Paul Hudson');
	}

	it('Displays Paul Hudson when filtering reviewers by a configured interest', function () {
		preserveEditedUsersLegacyInterest();
		assignInterestToPaulHudson();
		filterReviewersByInterest();
	});
});
