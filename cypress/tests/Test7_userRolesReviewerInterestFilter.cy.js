describe('Reviewer interest filter uses interests edited from Users & Roles', function () {
	const reviewerName = 'Paul Hudson';
	const reviewerUsername = 'phudson';
	const reviewingInterest = 'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico';
	const unexpectedInterest = 'Interest injected while editing another user';
	const submissionTitle = 'Condensing Water Availability Models to Focus on Specific Water Management Systems';

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

		cy.server();
		cy.route('POST', '**/grid/settings/user/user-grid/fetch-grid*').as('usersFiltered');
		cy.get('form#userSearchForm:visible input[name="search"]').clear().type(username, {delay: 0});
		cy.get('form#userSearchForm:visible button[id^="submitFormButton"]').click();
		cy.wait('@usersFiltered').its('status').should('eq', 200);
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

	function appendCanonicalizationCases($form, validInterest) {
		['', '   ', validInterest, '  ' + validInterest + '  '].forEach((interest) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: interest
			}).appendTo($form);
		});
	}

	function assertCanonicalInterest($form, validInterest) {
		const interests = $form.find('input[name="interests[]"]')
			.toArray()
			.map((input) => Cypress.$(input).val());

		expect(interests.filter((interest) => interest === validInterest)).to.have.length(1);
		expect(interests.filter((interest) => interest.trim() === '')).to.have.length(0);
	}

	function saveUserDetails() {
		cy.server();
		cy.route('POST', '**/grid/settings/user/user-grid/update-user*').as('userSaved');
		cy.get('form#userDetailsForm button[id^="submitFormButton"]')
			.scrollIntoView()
			.click();
		cy.wait('@userSaved').its('status').should('eq', 200);
		cy.waitJQuery();
	}

	function rejectUnexpectedInterest() {
		cy.get('form#userDetailsForm').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: unexpectedInterest
			}).appendTo($form);
		});
		saveUserDetails();
		cy.contains('Select only the predefined reviewing interests.').should('be.visible');
		cy.get('.pkpModalCloseButton').click();
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

		cy.get('a[id^=component-grid-users-reviewer-reviewergrid-addReviewer-button-]').click();
		cy.waitJQuery();
		cy.get('.listPanel--selectReviewer').should('be.visible');
	}

	function filterReviewersByInterest(interest) {
		cy.get('.listPanel--selectReviewer button:contains("Filter")').click();
		cy.contains('.listPanel--selectReviewer .pkpFilter label', interest)
			.scrollIntoView()
			.as('interestFilter')
			.click();
		cy.get('@interestFilter')
			.find('input[type="checkbox"]')
			.should('be.checked');
		cy.waitJQuery();
	}

	it('shows Paul Hudson in Add Reviewer when filtering by the selected interest', function () {
		cy.login('dbarnes', null, 'publicknowledge');

		openUserEditForm(reviewerUsername);
		rejectUnexpectedInterest();

		openUserEditForm(reviewerUsername);
		selectReviewingInterestIfMissing(reviewingInterest);
		cy.get('#userExtras .interests .tagit-label').contains(unexpectedInterest).should('not.exist');
		cy.get('#userDetailsForm').then(($form) => {
			appendCanonicalizationCases($form, reviewingInterest);
		});
		saveUserDetails();

		openUserEditForm(reviewerUsername);
		cy.get('#userDetailsForm').should(($form) => {
			assertCanonicalInterest($form, reviewingInterest);
		});

		openAddReviewerForSubmission(submissionTitle);
		filterReviewersByInterest(reviewingInterest);

		cy.contains(reviewerName);
	});
});
