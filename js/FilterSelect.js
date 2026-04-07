/**
 * FilterCheckboxes - A checkbox group filter for the reviewer list panel.
 *
 * Registered globally as 'filter-checkboxes' so it can be used via filterType
 * in the SelectReviewerListPanel filters config.
 */
(function () {
	'use strict';

	var FilterCheckboxes = {
		name: 'FilterCheckboxes',
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
				checkedValues: [],
			};
		},
		template:
			'<div class="pkpFilter pkpFilter--checkboxes">' +
			'<div class="pkpFilter__inputTitle" style="padding: 0.5rem 1rem; font-weight: bold; font-size: 13px;">' +
			'{{ title }}' +
			'</div>' +
			'<div style="padding: 0 0.5rem 0.5rem 1rem;">' +
			'<label ' +
			'v-for="opt in options" ' +
			':key="opt.value" ' +
			'style="display: flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0; font-size: 13px; cursor: pointer;"' +
			'>' +
			'<input ' +
			'type="checkbox" ' +
			':value="opt.value" ' +
			'v-model="checkedValues" ' +
			'@change="onCheck" ' +
			'/>' +
			'{{ opt.label }}' +
			'</label>' +
			'</div>' +
			'</div>',
		methods: {
			onCheck: function () {
				if (this.checkedValues.length === 0) {
					this.$emit('remove-filter', this.param, this.value);
				} else {
					this.$emit('add-filter', this.param, this.checkedValues.slice());
				}
			},
		},
		watch: {
			isFilterActive: function (newVal) {
				if (!newVal) {
					this.checkedValues = [];
				}
			},
		},
	};

	pkp.Vue.component('filter-checkboxes', FilterCheckboxes);
})();
