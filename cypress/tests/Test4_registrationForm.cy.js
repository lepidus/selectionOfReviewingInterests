describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
		const uniqueId = Date.now();
		cy.visit('/index.php/publicknowledge/user/register');
		cy.get('#reviewerOptinGroup').should('exist');
		cy.get('#reviewerInterests').should('not.exist');
		cy.get('input[name="interests"]').should('not.exist');
		cy.get('input[name="givenName"]').type('Security');
		cy.get('input[name="familyName"]').type('Test');
		cy.get('input[name="affiliation"]').type('PKP');
		cy.get('select[name="country"]').select('BR');
		cy.get('input[name="email"]').type('security-test-' + uniqueId + '@example.com');
		cy.get('input[name="username"]').type('securitytest' + uniqueId);
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
	});
});
