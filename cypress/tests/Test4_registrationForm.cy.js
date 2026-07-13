describe('Registration form should not display reviewing interests field', function () {
	it('Reviewing interests field is not present in the registration form', function () {
		const configuredInterest = 'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade';

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
			const $privacyConsent = $form.find('input[name^="privacyConsent"]');
			if ($privacyConsent.length) {
				cy.wrap($privacyConsent).check();
			}
			$form.append('<input type="hidden" name="interests[]" value="Hidden manipulated interest">');
		});
		cy.get('#register button[type="submit"]').click();

		cy.contains(
			'Select only reviewing interests configured for this journal. Previously saved interests may be preserved.'
		).should('be.visible');
		cy.url().should('include', '/user/register');

		cy.get('#register').then(($form) => {
			$form.find('input[name="interests[]"]').remove();
			const $privacyConsent = $form.find('input[name^="privacyConsent"]');
			if ($privacyConsent.length && !$privacyConsent.is(':checked')) {
				cy.wrap($privacyConsent).check();
			}
			[configuredInterest, '', '   ', configuredInterest, '  ' + configuredInterest + '  ']
				.forEach((interest) => {
					$form.append(Cypress.$('<input>', {
						type: 'hidden',
						name: 'interests[]',
						value: interest
					}));
				});
		});
		cy.get('#password').type('security-test-password');
		cy.get('#password2').type('security-test-password');
		cy.get('#register button[type="submit"]').click();
		cy.get('#register').should('not.exist');
		cy.get('.page_register_complete').should('be.visible');

		cy.visit('/index.php/publicknowledge/en/user/profile');
		cy.get('a[name="roles"]').click();
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
