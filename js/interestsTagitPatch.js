(function($) {
	var originalTagit = $.fn.tagit;
	$.fn.tagit = function(method) {
		var result = originalTagit.apply(this, arguments);
		if (typeof method !== 'string'
				&& $(this).hasClass('interests')
				&& !$(this).data('soriReinit')) {
			var ns = $.pkp && $.pkp.plugins
				&& $.pkp.plugins.generic
				&& $.pkp.plugins.generic.selectionOfReviewingInterests;
			if (ns && ns.interestsOptions) {
				originalTagit.call(this, 'destroy');
				var el = this;
				originalTagit.call(this, {
					fieldName: 'interests[]',
					availableTags: ns.interestsOptions,
					allowSpaces: true,
					autocomplete: {delay: 0, minLength: 0},
					beforeTagAdded: function(event, ui) {
						var availableTags = originalTagit.call(el, 'option', 'availableTags');
						var tagAllowed = $.map(availableTags, function(tag) {
							return tag.toLowerCase();
						}).indexOf(ui.tagLabel.toLowerCase()) !== -1;
						return tagAllowed;
					}
				});
				$(this).data('soriReinit', true);
				$(document)
					.off('focus.sori click.sori', '.tagit-new input')
					.on('focus.sori click.sori', '.tagit-new input', function() {
						$(this).autocomplete('search', '');
					});
			}
		}
		return result;
	};
})(jQuery);
