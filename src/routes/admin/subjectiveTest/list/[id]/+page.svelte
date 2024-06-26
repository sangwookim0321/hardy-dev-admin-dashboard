<!-- 주관식 테스트 상세 페이지 -->
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
		category: '',
		img_url: '',
		img_preview: '',
		questions: [
			{
				question_number: 1,
				question_name: '문제 이름',
				answer_list: [],
				question_etc: '기타설명설명',
				score: 10,
				sub_img_url: '',
				sub_img_preview: '',
				old_sub_img_url: '',
				isImageDeleted: false
			}
		]
	}
	let oldImageUrl = ''
	let deleteList = []

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

	function handleSubFileChange(event, index) {
		const file = event.target.files[0]
		if (file) {
			let fileReader = new FileReader()
			fileReader.readAsDataURL(file)
			fileReader.onload = () => {
				test.questions[index].sub_img_preview = fileReader.result
				test.questions[index].sub_img_url = file
				test.questions[index].isImageDeleted = false
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
				answer_list: [],
				question_etc: '',
				score: 0,
				sub_img_url: '',
				sub_img_preview: '',
				isNew: true
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
		test.questions[index].answer_list = [...test.questions[index].answer_list, '']

		setTimeout(() => {
			window.scrollBy({
				top: 300,
				left: 0,
				behavior: 'smooth'
			})
		}, 100)
	}

	function removeField(index, index2, type, id) {
		if (type === 'option') {
			test.questions[index].answer_list.splice(index2, 1)
			test = { ...test }
		} else if (type === 'question') {
			test.questions.splice(index, 1)

			test = { ...test }
			if (id) {
				deleteList.push(id)
			}
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
				sweetToast('문제 이름을 입력해주세요', 'warning')
				return
			}

			if (test.questions[i].answer_list.length < 2) {
				sweetToast('옵션을 2개 이상 입력해주세요', 'warning')
				return
			}

		}

		let formData = new FormData()

		formData.append('title', test.title)
		formData.append('sub_title', test.sub_title)
		formData.append('description', test.description)
		if (!test.category) {
			formData.append('category', '주관식')
		} else {
			formData.append('category', test.category)
		}
		if (test.img_url instanceof File) {
			formData.append('img', test.img_url)
		}
		formData.append('oldImageUrl', oldImageUrl)
		formData.append('deleteList', JSON.stringify(deleteList))

		const questionsData = test.questions.map((item, index) => {
			const { sub_img_preview, sub_img_url, isNew, ...rest } = item

			// 서브 이미지 파일이 있는 경우 formData 에 파일 추가
			if (sub_img_url instanceof File) {
				formData.append(`sub_img_url_${index}`, sub_img_url)
			}

			// 기존 서브 이미지 URL 전송 (수정 안됐을 경우)
			if (item.old_sub_img_url && !(sub_img_url instanceof File)) {
				formData.append(`old_sub_img_url_${index}`, item.old_sub_img_url)
			}

			if (isNew) {
				return { ...rest, isNew: true }
			} else {
				return { ...rest, id: item.id }
			}
		})

		formData.append('questions', JSON.stringify(questionsData))

		await httpPutFormData(
			`${endPoints.SUBJECTIVE_TEST}/${pageId}`,
			'subjectiveTestEdit',
			formData,
			true,
			(res) => {
				sweetToast('테스트 수정 완료', 'success')
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
			null,
			() => {}
		)
	}

	function setImageUrl(imgUrl) {
		// 이미지 도메인 경로 셋팅
		const domainPath = 'https://aqnmhrbebgwoziqtyyns.supabase.co/storage/v1/object/public/'
		test.img_preview = domainPath + imgUrl
	}

	function setImageUrlForQuestions(questions) {
		// 서브 이미지 도메인 경로 셋팅
		const domainPath = 'https://aqnmhrbebgwoziqtyyns.supabase.co/storage/v1/object/public/'
		questions.forEach((question) => {
			if (question.sub_img_url) {
				question.sub_img_preview = domainPath + question.sub_img_url
			}
		})
	}

	async function getItem() {
		await httpGet(
			`${endPoints.SUBJECTIVE_TEST}/${pageId}`,
			`subjectiveTestDetail/${pageId}`,
			true,
			(res) => {
				test = res.data.data
				oldImageUrl = res.data.data.img_url
				setImageUrl(test.img_url)
				setImageUrlForQuestions(test.questions)

				// 각 문제에 대해 old_sub_img_url 속성 추가
				test.questions.forEach((question) => {
					// 서브 이미지 URL을 old_sub_img_url에 저장
					if (question.sub_img_url) {
						question.old_sub_img_url = question.sub_img_url
					}
				})

				test.img_url = ''
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
			<span style="color: #fd7e14">주관식 테스트 상세</span>
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
					<label for="title">분류</label>
					<input type="text" id="category" class="title" placeholder="미입력시 기본 '주관식'" bind:value={test.category} />
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
								on:click={() => removeField(index, null, 'question', question.id)}
							/>
						{/if}
					</div>

					<label for={`sub_image_${index}`}>상세 이미지(선택사항)</label>
					<label for={`sub_file_upload_${index}`} class="custom_file_upload">
						<div style="cursor: pointer;" class="image_upload">
							{#if question.sub_img_preview}
								<img class="img_preview" src={question.sub_img_preview} alt="이미지" />
							{:else}
								<img src="/imgs/icon_add.svg" alt="이미지 추가" />
							{/if}
							{#if question.sub_img_preview}
								<img
									class="img_remove"
									src="/imgs/icon_remove.svg"
									alt="이미지 삭제"
									on:click={(event) => {
										event.preventDefault()
										question.sub_img_preview = ''
										question.sub_img_url = ''
										question.isImageDeleted = true
									}}
								/>
							{/if}
						</div>
						<input
							type="file"
							id={`sub_file_upload_${index}`}
							style="display: none;"
							class="file_upload"
							on:change={(event) => handleSubFileChange(event, index)}
						/>
					</label>

					<div class="question_set">
						<label for="question_number">문제 번호</label>
						<input
							type="number"
							id={`question_number_${index}`}
							class="question_number"
							bind:value={question.question_number}
						/>
						<label for={`question_name_${index}`}>문제 이름</label>
						<input
							type="text"
							id={`question_name_${index}`}
							class="question_name"
							bind:value={question.question_name}
						/>
						<label for={`question_etc_${index}`}>기타 문제설명(선택사항)</label>
						<textarea
							id={`question_etc_${index}`}
							class="question_etc"
							bind:value={question.question_etc}
						></textarea>
						{#each question.answer_list as option, index2}
							<div class="answer_list_box">
								<label
									style="font-weight: 600; color: var(--secondary-color);"
									for={`option_${index}_${index2}`}>{index2 + 1}번 옵션</label
								>
								{#if question.answer_list.length > 2}
									<img
										class="remove_img"
										src="/imgs/icon_remove.svg"
										alt="remove"
										on:click={() => removeField(index, index2, 'option', null)}
									/>
								{/if}
							</div>

							<input
								class="answer_list_input"
								type="text"
								id={`option_${index}_${index2}`}
								bind:value={question.answer_list[index2]}
							/>
						{/each}
						<button on:click={() => addOption(index)}>주관식 정답 추가(최소1개 이상 필수)</button>
						<label for={`score_${index}`}>배점(선택사항)</label>
						<input type="number" id={`score_${index}`} class="score" bind:value={question.score} />
					</div>
					<button on:click={addQuestion}>문제 추가</button>
					<hr />
				{/each}
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
		height: 10px;
		background-color: var(--main-bg-purple);
		margin: 5rem 0;
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
		padding: 1rem 5rem;
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
		position: fixed;
		top: 90%;
		margin-top: 3rem;
		padding: 1.2rem 6rem;
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
	.answer_list_box {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.answer_list_input {
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
			padding: 1.2rem 6rem;
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
