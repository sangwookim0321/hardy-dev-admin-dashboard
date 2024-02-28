<!-- 능력고사 테스트 등록 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath, storeLoadingState } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import useApi from '$lib/util/api'

	const { httpGet, httpPutFormData, endPoints, statusHandler } = useApi()

	let currentPath
	let pageId = $page.params.id

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		storeLoadingState.set(true)
		getItem()
	})

	let test = {
		title: '테스트 타이틀',
		sub_title: '테스트 서브 타이틀',
		description: '설명설명',
		img_url: '',
		img_preview: '',
		questions: [
			{
				question_number: 1,
				question_name: '질문 이름',
				question_list: ['1.질문', '2.질문'],
				question_etc: '기타설명설명',
				answer: 2,
				score: 10
			}
		]
	}
	let oldImageUrl = ''

	function handleFileChange(event) {
		const file = event.target.files[0]
		if (file) {
			let fileReader = new FileReader()
			fileReader.readAsDataURL(file)
			fileReader.onload = () => {
				test.img_preview = fileReader.result
				test.img_url = file
			}
		}
		event.target.value = ''
	}

	function addQuestion() {
		test.questions = [
			...test.questions,
			{
				question_number: test.questions.length + 1,
				question_name: '',
				question_list: [],
				question_etc: '',
				answer: 0,
				score: 0
			}
		]

		setTimeout(() => {
			window.scrollBy({
				top: 600,
				behavior: 'smooth'
			})
		}, 100)
	}

	function addOption(index) {
		test.questions[index].question_list = [...test.questions[index].question_list, '']

		setTimeout(() => {
			window.scrollBy({
				top: 300,
				left: 0,
				behavior: 'smooth'
			})
		}, 100)
	}

	function removeField(index, index2, type) {
		if (type === 'option') {
			test.questions[index].question_list.splice(index2, 1)

			test = { ...test }
		} else if (type === 'question') {
			test.questions.splice(index, 1)

			test = { ...test }
		}
	}

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	async function saveTest() {
		if (!test.img_preview) {
			sweetToast('이미지를 업로드해주세요', 'warning')
			return
		}
		if (!test.title) {
			sweetToast('제목을 입력해주세요', 'warning')
			return
		}
		if (!test.sub_title) {
			sweetToast('서브 제목을 입력해주세요', 'warning')
			return
		}
		if (!test.description) {
			sweetToast('설명을 입력해주세요', 'warning')
			return
		}

		for (let i = 0; i < test.questions.length; i++) {
			if (!test.questions[i].question_name) {
				sweetToast('질문 이름을 입력해주세요', 'warning')
				return
			}

			if (test.questions[i].question_list.length < 2) {
				sweetToast('옵션을 2개 이상 입력해주세요', 'warning')
				return
			}

			if (test.questions[i].answer < 1) {
				sweetToast('정답을 입력해주세요', 'warning')
				return
			}
		}

		let formData = new FormData()
		formData.append('title', test.title)
		formData.append('sub_title', test.sub_title)
		formData.append('description', test.description)
		formData.append('img', test.img_url)
		formData.append('oldImageUrl', oldImageUrl)
		formData.append('questions', JSON.stringify(test.questions))

		await httpPutFormData(
			`${endPoints.ABILITY_TEST}/${pageId}`,
			'abilityTestEdit',
			formData,
			true,
			(res) => {
				sweetToast('테스트 수정 완료', 'success')
				getItem()
			},
			(err) => {
				console.log(err)
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
			null,
			() => {}
		)
	}

	function setImageUrl(imgUrl) {
		// 이미지 도메인 경로 셋팅
		const domainPath = 'https://aqnmhrbebgwoziqtyyns.supabase.co/storage/v1/object/public/'
		test.img_preview = domainPath + imgUrl
	}

	async function getItem() {
		await httpGet(
			`${endPoints.ABILITY_TEST}/${pageId}`,
			`abilityTestDetail/${pageId}`,
			true,
			(res) => {
				test = res.data.data
				oldImageUrl = res.data.data.img_url
				setImageUrl(test.img_url)
				test.img_url = ''
			},
			(err) => {
				console.log(err)
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
			<span>능력고사 테스트 상세</span>
		</div>

		<div class="main_box">
			<div class="test_info">
				<label for="file_upload" class="custom_file_upload">
					<div style="cursor: pointer;" class="image_upload">
						{#if test.img_preview}
							<img class="img_preview" src={test.img_preview} alt="이미지" />
						{:else}
							<img src="/imgs/icon_add.svg" alt="이미지 추가" />
						{/if}
						{#if test.img_preview}
							<img
								class="img_remove"
								src="/imgs/icon_remove.svg"
								alt="이미지 삭제"
								on:click={(event) => {
									event.preventDefault()
									test.img_preview = ''
									test.img_url = ''
								}}
							/>
						{/if}
					</div>
					<input
						type="file"
						id="file_upload"
						style="display: none;"
						class="file_upload"
						on:change={handleFileChange}
					/>
				</label>
				<div class="test_details">
					<label for="title">제목</label>
					<input type="text" id="title" class="title" bind:value={test.title} />
					<label for="sub_title">서브 제목</label>
					<input type="text" id="sub_title" class="sub_title" bind:value={test.sub_title} />
					<label for="description">설명</label>
					<textarea id="description" class="description" bind:value={test.description}></textarea>
				</div>
			</div>

			<hr />

			<div class="questions">
				{#each test.questions as question, index}
					<div class="questions_top_box">
						<label style="font-weight: 600; font-size: 2rem;" for={`question_number_${index}`}
							>{index + 1}번</label
						>
						{#if test.questions.length > 1}
							<img
								class="remove_img"
								src="/imgs/icon_remove.svg"
								alt="remove"
								on:click={() => removeField(index, null, 'question')}
							/>
						{/if}
					</div>

					<div class="question_set">
						<label for="question_number">질문 번호</label>
						<input
							type="number"
							id={`question_number_${index}`}
							class="question_number"
							bind:value={question.question_number}
						/>
						<label for={`question_name_${index}`}>질문 이름</label>
						<input
							type="text"
							id={`question_name_${index}`}
							class="question_name"
							bind:value={question.question_name}
						/>
						{#each question.question_list as option, index2}
							<div class="question_list_box">
								<label
									style="font-weight: 600; color: var(--secondary-color);"
									for={`option_${index}_${index2}`}>{index2 + 1}번 옵션</label
								>
								{#if question.question_list.length > 2}
									<img
										class="remove_img"
										src="/imgs/icon_remove.svg"
										alt="remove"
										on:click={() => removeField(index, index2, 'option')}
									/>
								{/if}
							</div>

							<input
								class="question_list_input"
								type="text"
								id={`option_${index}_${index2}`}
								bind:value={question.question_list[index2]}
							/>
						{/each}
						<button on:click={() => addOption(index)}>옵션(객관식) 추가</button>
						<label for={`question_etc_${index}`}>기타 문제설명</label>
						<textarea
							id={`question_etc_${index}`}
							class="question_etc"
							bind:value={question.question_etc}
						></textarea>
						<label for={`answer_${index}`}>정답</label>
						<input
							type="number"
							id={`answer_${index}`}
							class="answer"
							bind:value={question.answer}
						/>
						<label for={`score_${index}`}>배점</label>
						<input type="number" id={`score_${index}`} class="score" bind:value={question.score} />
						<hr />
					</div>
				{/each}
				<button on:click={addQuestion}>질문 추가</button>
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
	.image_upload {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 300px;
		height: 300px;
		background-color: var(--main-bg-lightGray);
		border-radius: 10px;
	}
	.questions {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 50%;
	}
	.question_set {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	.description,
	.question_etc {
		height: 150px;
	}
	.questions_top_box {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
	hr {
		width: 100%;
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
		padding: 1rem 1.2rem;
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
	.save_button {
		margin-top: 3rem;
		padding: 1rem 6rem;
		border: none;
		border-radius: 10px;
		background-color: var(--main-bg-purple);
		color: white;
		cursor: pointer;
	}
	.save_button:hover {
		background-color: var(--main-bg-darkPurple);
	}
	.img_preview {
		width: 300px;
		height: 300px;
		object-fit: cover;
		border-radius: 10px;
	}
	.img_remove {
		position: absolute;
		top: 2%;
		right: 2%;
		cursor: pointer;
	}
	.remove_img {
		width: 2.2rem;
		cursor: pointer;
		margin-left: 1rem;
	}
	.question_list_box {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.question_list_input {
		border: 1px solid var(--main-bg-gray);
		border-radius: 10px;
		padding: 1.2rem 1rem;
	}

	@media (max-width: 768px) {
		.test_details {
			width: 100%;
		}
		.main_top_box {
			margin: 2rem 0;
		}
		.main_top_box img {
			width: 1rem;
		}
		.main_top_box span {
			font-size: 1.5rem;
		}
		input {
			font-size: 1.5rem;
		}
		label {
			font-size: 1.5rem;
		}
		textarea {
			font-size: 1.5rem;
		}
		.questions {
			width: 100%;
		}
		.save_button {
			padding: 1rem 4rem;
		}
		.custom_file_upload {
			width: 100%;
		}
		.image_upload {
			width: 100%;
		}
		.img_preview {
			width: 100%;
			height: 300px;
		}
		.img_remove {
			position: absolute;
			top: 2%;
			right: 1.5%;
			cursor: pointer;
		}
	}
</style>
