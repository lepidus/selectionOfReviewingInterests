/**
 * FilterSelect - A select dropdown filter component for the reviewer list panel.
 *
 * Registered globally as 'filter-select' so it can be used via filterType
 * in the SelectReviewerListPanel filters config.
 */
(function () {
	'use strict';

	var FilterSelect = {
		name: 'FilterSelect',
		props: {
			isFilterActive: {
				type: Boolean,
				default: false,
			},
			param: {
				type: String,
				required: true,
			},
			title: {
				type: String,
				required: true,
			},
			value: {
				type: [String, Number, Boolean, Array, Object],
				required: true,
			},
			options: {
				type: Array,
				required: true,
			},
		},
		emits: ['add-filter', 'update-filter', 'remove-filter'],
		data: function () {
			return {
				currentValue: this.value,
			};
		},
		template:
			'<div class="pkpFilter pkpFilter--select">' +
			'<div class="pkpFilter__inputTitle" style="padding: 0.5rem 1rem; font-weight: bold; font-size: 13px;">' +
			'{{ title }}' +
			'</div>' +
			'<div style="padding: 0 1rem 0.5rem;">' +
			'<select ' +
			'v-model="currentValue" ' +
			'@change="onSelect" ' +
			'style="width: 100%; padding: 0.35rem; border: 1px solid #ddd; border-radius: 2px; font-size: 13px;"' +
			'>' +
			'<option ' +
			'v-for="opt in options" ' +
			':key="opt.value" ' +
			':value="opt.value"' +
			'>' +
			'{{ opt.label }}' +
			'</option>' +
			'</select>' +
			'</div>' +
			'</div>',
		methods: {
			onSelect: function () {
				if (this.currentValue === '' || this.currentValue === null) {
					this.$emit('remove-filter', this.param, this.value);
				} else {
					this.$emit('add-filter', this.param, this.currentValue);
				}
			},
		},
		watch: {
			isFilterActive: function (newVal) {
				if (!newVal) {
					this.currentValue = '';
				}
			},
		},
	};

	pkp.registry.registerComponent('filter-select', FilterSelect);
})();
