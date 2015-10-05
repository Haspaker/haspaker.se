window <<< require 'prelude-ls'

class Page extends Backbone.Model

	view: PageView

	defaults:
		active: false

	activate: -> @set \active, true
	deactivate: -> @set \active, false

class PageView extends Backbone.View

	initialize: ->
		@listenTo @model, 'change:active', @show_hide
		if @model.get \active => @show!

	show_hide: ->
		if @model.get \active => @show!
		else => @hide!

	show: -> @$el.fadeIn()

	hide: ->  @$el.stop().hide!


class LandingPageView extends PageView

	el: \section.landing

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
		$('.portfolio').show()
		$('.portfolio').css position: \absolute, top: height, left: 0
		$('.greeting').css visibility: \hidden 
		$('.main-content').animate top: -$('.main-content').height()

	hide_portfolio: ->
		$('.go-down-title').text('View portfolio')
		$('.portfolio').hide()
		$('.greeting').css visibility: \visible 
		$('.main-content').animate top: 0

class ContactPageView extends PageView

	el: \section.contact

class SkillsPageView extends PageView

	el: \section.skills

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
		'click .pages div': (e) -> @select_page $(e.target).index()

	pages:
		* LandingPageView
		* SkillsPageView
		* ContactPageView

	initialize: ->

		for page_model, i in @model.pages
			@pages[i] = new @pages[i] model: page_model

		page_index = @model.get \page_index
		#@pages[ page_index ].$el.show!

		@listenTo @model, 'change:page_index', @move_arrow
		@listenTo @model, 'change:page_index', @render
		$(window).resize @position_arrow
		@position_arrow!

		@render!

	get_selected_page_label: ->
		page_index = @model.get \page_index
		label_index = page_index + 1
		@$(".page-label:nth-child(#label_index)")

	render: ->
		@$(\.page-label).removeClass \selected
		@get_selected_page_label().addClass \selected

	position_arrow: ~>

		$selected_page_label = @get_selected_page_label()

		with $selected_page_label[0].getBoundingClientRect()
			@$( \.arrow ).css top: ..top + 8
			@$( \.arrow ).css left: ..right + 10

	move_arrow: ->

		$selected_page_label = @get_selected_page_label()

		with $selected_page_label[0].getBoundingClientRect()
			@$( \.arrow ).stop().animate ( top: ..top + 8, left: ..right + 10 ),
				1500,
				\easeOutElastic

	select_page: (index) -> @model.set \page_index, index

class Site extends Backbone.Model

	defaults:
		drapery: false

class SiteView extends Backbone.View

	initialize: ->

		@is_chrome = /Chrome/i.test(navigator.userAgent)
		@is_firefox = /Firefox/i.test(navigator.userAgent)
		@is_safari = /Safari/i.test(navigator.userAgent) and not @is_chrome
		@is_device = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

		if not @is_device
			if @is_chrome or @is_firefox
				$(document).on 'scroll', @keep_edge_fixed
				$(window).resize @keep_edge_fixed
				@listenTo window.navigation, 'change:page_index', @keep_edge_fixed

		@listenTo @model, 'change:drapery', @toggle_drapery

	toggle_drapery: ->
		$('.main-content').toggleClass \drapery 

	keep_edge_fixed: ->
		with $(window) =>
			$('.edge .ribbon').css height: $(document).height() - ..scrollTop(), top: ..scrollTop()



class NameView extends Backbone.View

	el: \.full-name

	frames: 30
	current_frame: 1

	animation_time: 2000ms
	animation_delay: 1500ms

	loaded_frames: 0
	init_time: Date.now()

	interval: null

	initialize: ->

		@create_frame_divs!
		@preload_images!

		setTimeout @start_animation, @animation_delay

		@listenTo @model, 'change:active', ~> if @model.get(\active) => @restart_animation!

	frame_url: (frame) -> "http://www.haspaker.se/img/swirl/frame-#frame.png"
	frame_div: (frame) -> $(".swirl.frame-#frame")

	set_frame: (frame) -> 
		@current_frame = frame
		$(".swirl").css visibility: \hidden
		@frame_div(frame).css visibility: \visible

	create_frame_divs: ->
		for i from 1 to @frames
			$('<div/>')
				.addClass("swirl frame-#i")
				.css visibility: \hidden
				.appendTo @$el

	next_frame: ~>
		if @current_frame < @frames
			@set_frame @current_frame + 1

	start_animation: ~>
		if Date.now() - @init_time < @animation_delay => return
		if @loaded_frames isnt @frames => return
		if @current_frame isnt 1 => return
		@interval = setInterval @next_frame, @animation_time / @frames

	restart_animation: ~>
		@set_frame 1
		clearInterval @interval
		setTimeout @start_animation, @animation_delay

	preload_images: ~>
		window.preloaded_name_imgs = []
		for frame_index from 1 to @frames => let frame_index
			img = window.preloaded_name_imgs[ frame_index ] = new Image()
			img.onload = ~> if ++@loaded_frames is @frames then @start_animation!
			img.src = @frame_url frame_index
			$(img).appendTo @frame_div frame_index




$ ->

	window.site = new Site()
	window.navigation = new Navigation()
	siteView = new SiteView model: window.site
	navigationView = new NavigationView model: window.navigation
