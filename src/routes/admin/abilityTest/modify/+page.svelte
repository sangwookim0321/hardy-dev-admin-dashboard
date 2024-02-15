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

<h1>능력고사 테스트 수정 페이지</h1>
