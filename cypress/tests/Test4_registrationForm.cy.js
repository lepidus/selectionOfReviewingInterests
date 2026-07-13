describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
		const configuredInterest = 'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico';

		cy.visit('/index.php/publicknowledge/user/register');
		cy.get('#reviewerOptinGroup').should('exist');
		cy.get('#reviewerInterests').should('not.exist');
		cy.get('input[name="interests"]').should('not.exist');
		cy.get('input[name="givenName"]').type('Security');
		cy.get('input[name="familyName"]').type('Test');
		cy.get('input[name="affiliation"]').type('PKP');
		cy.get('select[name="country"]').select('BR');
		cy.get('input[name="email"]').type('security-common-user@example.com');
		cy.get('input[name="username"]').type('securitycommonuser');
		cy.get('input[name="password"]').type('security-test-password');
		cy.get('input[name="password2"]').type('security-test-password');
		cy.get('input[name="privacyConsent"]').check();

		cy.get('form#register').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: 'Interest injected into registration'
			}).appendTo($form);
		});
		cy.get('form#register button[type="submit"]').click();
		cy.contains('Select only the predefined reviewing interests.').should('be.visible');

		cy.get('form#register').then(($form) => {
			$form.find('input[name="interests[]"]').remove();
		});
		cy.get('input[name="password"]').type('security-test-password');
		cy.get('input[name="password2"]').type('security-test-password');
		cy.get('form#register').then(($form) => {
			[configuredInterest, '', '   ', configuredInterest, '  ' + configuredInterest + '  ']
				.forEach((interest) => {
					Cypress.$('<input>', {
						type: 'hidden',
						name: 'interests[]',
						value: interest
					}).appendTo($form);
				});
		});
		cy.get('form#register button[type="submit"]').click();
		cy.get('form#register').should('not.exist');
		cy.get('.page_register_complete').should('be.visible');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests').should('be.visible');
		cy.get('#rolesForm').should(($form) => {
			expect($form.text()).not.to.include('Interest injected into registration');
			const interests = $form.find('input[name="interests[]"]')
				.toArray()
				.map((input) => Cypress.$(input).val());
			expect(interests).not.to.include('Interest injected into registration');
			expect(interests.filter((interest) => interest === configuredInterest)).to.have.length(1);
			expect(interests.filter((interest) => interest.trim() === '')).to.have.length(0);
		});
		cy.logout();
	});
});
