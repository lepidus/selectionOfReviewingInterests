describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
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
		cy.get('form#register button[type="submit"]').click();
		cy.location('pathname').should('not.include', '/user/register');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-label').contains('Interest injected into registration').should('not.exist');
		cy.logout();
	});
});
