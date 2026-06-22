describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
		cy.visit('/index.php/publicknowledge/user/register');
		cy.get('#reviewerOptinGroup').should('exist');
		cy.get('#reviewerInterests').should('not.exist');
		cy.get('input[name="interests"]').should('not.exist');
	});
});
