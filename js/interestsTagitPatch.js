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
				var existingTags = originalTagit.call(this, 'assignedTags') || [];
				var existingTagsLower = $.map(existingTags, function(tag) {
					return tag.toLowerCase();
				});

				originalTagit.call(this, 'destroy');
				var el = this;
				originalTagit.call(this, {
					fieldName: 'interests[]',
					availableTags: ns.interestsOptions,
					allowSpaces: true,
					autocomplete: {delay: 0, minLength: 0},
					beforeTagAdded: function(event, ui) {
						var availableTags = originalTagit.call(el, 'option', 'availableTags');
						var tagLower = ui.tagLabel.toLowerCase();
						var inAllowedList = $.map(availableTags, function(tag) {
							return tag.toLowerCase();
						}).indexOf(tagLower) !== -1;
						var isPreExisting = existingTagsLower.indexOf(tagLower) !== -1;
						return inAllowedList || isPreExisting;
					}
				});

				$.each(existingTags, function(i, tag) {
					var currentTags = originalTagit.call(el, 'assignedTags') || [];
					var currentTagsLower = $.map(currentTags, function(t) {
						return t.toLowerCase();
					});
					if (currentTagsLower.indexOf(tag.toLowerCase()) === -1) {
						originalTagit.call(el, 'createTag', tag);
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
