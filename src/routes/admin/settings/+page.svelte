<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { storePath } from '$lib/store/store'

	let currentPath

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		console.log($storePath)
	})
</script>

<main>
	<div class="main_top_box">
		<img src="/imgs/icon_left.svg" alt="icon" />
		<span>설정</span>
	</div>
</main>
