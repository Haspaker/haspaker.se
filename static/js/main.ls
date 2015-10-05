window <<< require 'prelude-ls'

class Page extends Backbone.Model

	title: null

	view: PageView

	defaults:
		active: false

	activate: -> @set \active, true
	deactivate: -> @set \active, false

class PageView extends Backbone.View

	initialize: ->
		@listenTo @model, 'change:active', @show_hide
		@listenTo @model, 'change:active', @set_title
		if @model.get \active => @show!

	show_hide: ->
		if @model.get \active => @show!
		else => @hide!

	show: -> @$el.fadeIn()

	hide: ->  @$el.stop().hide!

	set_title: ~>
		if @title and @model.get \active => 
			document.title = @title


class LandingPageView extends PageView

	el: \section.landing

	title: "Hannes Aspåker"

	events: ->
		'click .go-down:not(.go-back)': @scroll_to_portfolio
		'click .go-back': @hide_portfolio

	initialize: -> super ...

	show: ->
		with window.navigation
			# Don't animate if website just loaded the front page
			if ..previous("page_index") is ..hashlinks.about => @$el.show!
			else super ...

	scroll_to_portfolio: ->

		height = $('.main-content').height()
		$('body').scrollTop 0
		$('.portfolio').show()
		$('.portfolio').css position: \absolute, top: height, left: 0
		$('.greeting').css visibility: \hidden 
		$('.main-content').animate top: -$('.main-content').height()

	hide_portfolio: ->
		$('body').scrollTop 0
		$('.portfolio').hide()
		$('.greeting').css visibility: \visible 
		$('.main-content').animate top: 0

class ContactPageView extends PageView

	el: \section.contact

	title: "Hannes Aspåker | Contact"

	show: -> @$el.show()

class SkillsPageView extends PageView

	el: \section.skills

	title: "Hannes Aspåker | Skills"

	skills:
		'coffeescript': 1.00
		'html / css': 1.00
		'javascript': 0.85
		'php': 0.70
		'swift': 0.50
		'node.js': 1.00
		'wordpress': 0.90
		'cocoa': 0.50

	max_bar_width: 250px

	initialize: ->
		$(window).resize @adjust_graph_bars
		super ...

	hide_graph_bars: ->
		@$('.skill-graph .bar').css width: 0

	get_bar_width: (ratio) -> @max_bar_width * ratio * Math.min 1, $(window).width() / 800	

	get_bar_by_label: (label) -> @$( ".skill .label:contains('#label') + .bar")

	show_graph_bars: ~>
		@hide_graph_bars!
		for label, ratio of @skills
			@get_bar_by_label(label).delay(500).animate width: @get_bar_width(ratio), 4000, \easeOutElastic

	adjust_graph_bars: ~>
		for label, ratio of @skills
			@get_bar_by_label(label).stop().css width: @get_bar_width(ratio)

	show: -> 
		window.site.set \drapery, true
		@show_graph_bars!
		@$el.fadeIn() # Pass 0s duration to make delayable animation

	hide: -> 
		window.site.set \drapery, false
		@$el.hide!


class Navigation extends Backbone.Model

	defaults:
		page_index: 0

	pages: 
		* Page
		* Page
		* Page

	hashlinks:
		landing: 0
		skills: 1
		contact: 2

	initialize: ->

		@pages |>= map (new)

		@hashlink!
		@change_page!

		window.onhashchange = @hashlink

		@on 'change:page_index', @change_page
		@on 'change:page_index', @update_hash

	change_page: ->
		index = @get \page_index
		@pages.map -> it.deactivate!
		@pages[index].activate!

	hashlink: ~>
		hash = tail location.hash
		if hash in keys @hashlinks
			@set \page_index, @hashlinks[hash]

	update_hash: ~>
		index = @get \page_index
		window.location.hash = (keys @hashlinks)[index]


class NavigationView extends Backbone.View

	el: \.navigation

	events:
		'click .pages .page-label': (e) -> @select_page $(e.target).index()

	pages:
		* LandingPageView
		* SkillsPageView
		* ContactPageView

	initialize: ->

		for page_model, i in @model.pages
			@pages[i] = new @pages[i] model: page_model

		page_index = @model.get \page_index

		@listenTo @model, 'change:page_index', @move_arrow
		@listenTo @model, 'change:page_index', @render

		@render!

	get_selected_page_label: ->
		page_index = @model.get \page_index
		label_index = page_index + 1
		@$(".page-label:nth-child(#label_index)")

	render: ->
		@$(\.page-label).removeClass \selected
		@get_selected_page_label().addClass \selected

	select_page: (index) -> @model.set \page_index, index

class Site extends Backbone.Model

class SiteView extends Backbone.View



$ ->

	window.site = new Site()
	window.navigation = new Navigation()
	siteView = new SiteView model: window.site
	navigationView = new NavigationView model: window.navigation
