describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
		cy.visit('/index.php/publicknowledge/user/register');
		cy.get('#reviewerOptinGroup').should('exist');
		cy.get('#reviewerInterests').should('not.exist');
		cy.get('input[name="interests"]').should('not.exist');

		cy.get('#givenName').type('Manipulated');
		cy.get('#familyName').type('Registration');
		cy.get('#affiliation').type('Security test');
		cy.get('#country').select('BR');
		cy.get('#email').type('manipulated-registration@example.com');
		cy.get('#username').type('manipulated_registration');
		cy.get('#password').type('security-test-password');
		cy.get('#password2').type('security-test-password');
		cy.get('#register').then(($form) => {
			$form.append('<input type="hidden" name="interests[]" value="Hidden manipulated interest">');
		});
		cy.get('#register button[type="submit"]').click();

		cy.contains(
			'Select only reviewing interests configured for this journal. Previously saved interests may be preserved.'
		).should('be.visible');
		cy.url().should('include', '/user/register');
	});
});
