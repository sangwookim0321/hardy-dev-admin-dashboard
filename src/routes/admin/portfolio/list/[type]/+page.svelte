<!-- 포트폴리오 데이터 상세 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath, storeLoadingState } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import useApi from '$lib/util/api'

	const { httpGet, httpPut, endPoints, statusHandler } = useApi()

	let currentPath
	let pageType = $page.params.type

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		storeLoadingState.set(true)
		getItem()
	})

	let data = {
		content: '',
		selectedType: 'HTML'
	}

	let types = [
		'HTML',
		'CSS',
		'JAVASCRIPT',
		'REACT',
		'VUE',
		'SVELTE',
		'NODE',
		'EXPRESS',
		'GITHUB',
		'GITLAB'
	]

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	async function getItem() {
		await httpGet(
			`${endPoints.PORTFOLIO}/${pageType}`,
			`PORTFOLIO/${pageType}`,
			true,
			(res) => {
				data.content = res.data.data.content
				data.selectedType = res.data.data.type
			},
			(err) => {
				console.error(err)
				statusHandler(
					err.status,
					() => {
						sweetToast(err.message, 'error')
					},
					async () => {
						await goto('/')
						sweetToast(err.message, 'error')
					}
				)
			},
			() => {},
			() => {
				storeLoadingState.set(false)
			}
		)
	}

	function handleTypeSelection(event) {
		data.selectedType = event.target.value
	}

	async function saveTest() {
		if (data.content === '') {
			sweetToast('내용을 입력해주세요', 'warning')
			return
		}

		if (data.selectedType === '') {
			sweetToast('유형을 선택해주세요', 'warning')
			return
		}

		await httpPut(
			`${endPoints.PORTFOLIO}/${pageType}`,
			'PORTFOLIO',
			data,
			true,
			(res) => {
				sweetToast('포트폴리오 데이터 수정 완료', 'success')
				getItem()
			},
			(err) => {
				console.error(err)
				statusHandler(
					err.status,
					() => {
						sweetToast(err.message, 'error')
					},
					async () => {
						await goto('/')
						sweetToast(err.message, 'error')
					}
				)
			},
			() => {},
			() => {}
		)
	}

	function movePage() {
		history.back()
	}
</script>

{#if $storeLoadingState}
	<LoadingSpinner />
{:else}
	<main>
		<div class="main_top_box">
			<img
				style="cursor: pointer;"
				src="/imgs/icon_left.svg"
				alt="icon"
				on:click={() => {
					movePage()
				}}
			/>
			<span>포트폴리오 데이터 수정</span>
		</div>

		<div class="main_box">
			<div class="test_info">
				<div class="test_details">
					<div class="description_box">
						<label for="description">내용</label>
						<select bind:value={data.selectedType} on:change={handleTypeSelection}>
							{#each types as type}
								<option value={type}>{type}</option>
							{/each}
						</select>
					</div>
					<textarea id="description" class="description" bind:value={data.content}></textarea>
				</div>
			</div>
			<button class="save_button" on:click={saveTest}>저장</button>
		</div>
	</main>
{/if}

<style>
	.test_info {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	.test_details {
		display: flex;
		flex-direction: column;
		margin-top: 2rem;
		width: 50%;
	}
	.description {
		height: 150px;
	}
	.description_box {
		display: flex;
		justify-content: space-between;
	}
	select {
		appearance: none;
		padding: 0.5rem 2rem;
		border: 1px solid var(--main-bg-lightGray-02);
		background-color: var(--main-bg-white);
		cursor: pointer;
	}
	select:focus {
		outline: none;
		border-color: var(--main-bg-lightGray);
	}
	select option {
		border: none;
		outline: none;
		background-color: var(--main-bg-lightGray-02);
	}
	hr {
		width: 100%;
		height: 10px;
		background-color: var(--main-bg-purple);
		margin: 5rem 0;
		border: 1px solid var(--main-bg-purple);
	}
	input {
		margin: 2rem 0;
		border: none;
		border-bottom: 1px solid var(--main-bg-gray);
		outline: none;
		padding: 0.5rem 0;
		box-sizing: border-box;
	}
	input:focus {
		border-color: var(--main-bg-purple);
		outline: none;
	}
	textarea {
		border: none;
		outline: none;
		border-bottom: 1px solid #ccc;
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0;
		font-size: 1.5rem;
	}
	textarea:focus {
		border-color: var(--main-bg-purple);
		outline: none;
	}
	button {
		margin: 1rem 0;
		padding: 1rem 4.5rem;
		border: none;
		border-radius: 10px;
		background-color: var(--main-bg-lightGray);
		color: var(--main-bg-white);
		cursor: pointer;
	}
	button:hover {
		background-color: var(--main-bg-gray);
	}
	label {
		margin: 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}
</style>
