<script>
	import { onMount } from 'svelte'

	export let fetchNext

	onMount(() => {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				fetchNext()
			}
		})

		observer.observe(document.querySelector('#infinite-scroll-trigger'))

		return () => {
			observer.disconnect()
		}
	})
</script>

<div id="infinite-scroll-trigger"></div>
