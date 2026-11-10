describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
		const username = 'sorisecurityregistration';
		const password = 'SoriSecurityRegistration123!';
		const invalidInterestMessage = 'Select only the predefined reviewing interests.';
		const configuredInterest = 'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico';

		cy.visit('/index.php/publicknowledge/user/register');
		cy.get('#reviewerOptinGroup').should('exist');
		cy.get('#reviewerInterests').should('not.exist');
		cy.get('input[name="interests"]').should('not.exist');

		cy.get('#givenName').type('Sori Security');
		cy.get('#affiliation').type('Security test');
		cy.get('#country').select('Brazil');
		cy.get('#email').type(username + '@example.com');
		cy.get('#username').type(username);
		cy.get('#password').type(password);
		cy.get('#password2').type(password);
		cy.get('form#register').then(($form) => {
			const $checkbox = $form.find('input[name="privacyConsent"]');
			if ($checkbox.length) {
				cy.wrap($checkbox).check();
			}
		});

		cy.get('form#register').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: 'Interest injected into registration'
			}).appendTo($form);
		});
		cy.get('form#register button[type="submit"]').click();
		cy.contains(invalidInterestMessage).should('be.visible');

		cy.get('form#register').then(($form) => {
			$form.find('input[name="interests[]"]').remove();
		});
		cy.get('#givenName').clear().type('Sori Security');
		cy.get('#affiliation').clear().type('Security test');
		cy.get('#country').select('Brazil');
		cy.get('#email').clear().type(username + '@example.com');
		cy.get('#username').clear().type(username);
		cy.get('#password').type(password);
		cy.get('#password2').type(password);
		cy.get('form#register').then(($form) => {
			const $checkbox = $form.find('input[name="privacyConsent"]');
			if ($checkbox.length && !$checkbox.is(':checked')) {
				cy.wrap($checkbox).check();
			}

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
		cy.get('#rolesForm').should(($form) => {
			const interests = $form.find('input[name="interests[]"]')
				.toArray()
				.map((input) => Cypress.$(input).val());
			expect(interests.filter((interest) => interest === configuredInterest)).to.have.length(1);
			expect(interests.filter((interest) => interest.trim() === '')).to.have.length(0);
		});
	});
});
