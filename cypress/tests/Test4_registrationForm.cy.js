describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
		const username = 'sorisecurityregistration';
		const password = 'SoriSecurityRegistration123!';
		const invalidInterestMessage = 'Select only the predefined reviewing interests.';

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

		cy.get('input[name="interests[]"]').then(($interest) => $interest.remove());
		cy.get('form#register button[type="submit"]').click();
		cy.location('pathname').should('not.include', '/user/register');
	});
});
