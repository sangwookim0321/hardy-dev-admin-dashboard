// routes/api/autoCrawling/+server.js
import { json } from '@sveltejs/kit'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

let browser = null
let page = null
let isCrawling = false
let imgDir = path.resolve('./static/crawled_images')

function deleteDownloadedImages() {
	fs.readdir(imgDir, (err, files) => {
		if (err) throw err
		for (const file of files) {
			fs.unlink(path.join(imgDir, file), (err) => {
				if (err) throw err
			})
		}
	})
}

export async function POST({ request }) {
	const { keyword, count } = await request.json()
	try {
		isCrawling = true
		browser = await puppeteer.launch()
		page = await browser.newPage()

		await page.goto(`https://www.google.com/search?q=${keyword}&tbm=isch`)

		const images = await page.evaluate(() => {
			const imgElements = document.querySelectorAll('img')
			return Array.from(imgElements, (img) => img.src)
		})

		// 디렉토리가 없으면 생성
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir, { recursive: true })
		}

		for (let i = 0; i < Math.min(count, images.length); i++) {
			if (!isCrawling) break

			const imgUrl = images[i]
			const imgName = `${keyword}_${i}.jpg`
			const imgPath = path.join(imgDir, imgName)
			try {
				const viewSource = await page.goto(imgUrl)
				const buffer = await viewSource.buffer()
				fs.writeFileSync(imgPath, buffer)
			} catch (error) {
				console.error(`Failed to download image: ${imgUrl}`, error)
				// 유효하지 않은 URL인 경우 해당 이미지 다운로드를 건너뜁니다.
			}
		}

		await browser.close()

		if (isCrawling) {
			// ZIP 파일 생성
			const zipFileName = `${keyword}_images.zip`
			const zipPath = path.resolve('./static', zipFileName)
			const output = fs.createWriteStream(zipPath)
			const archive = archiver('zip', {
				zlib: { level: 9 }
			})

			output.on('close', () => {
				console.log(`ZIP file created: ${zipPath}`)
			})

			archive.on('error', (err) => {
				throw err
			})

			archive.pipe(output)

			// 이미지 파일이 있는 경우에만 ZIP에 추가
			const files = await fs.promises.readdir(imgDir)
			if (files.length > 0) {
				files.forEach((file) => {
					const filePath = path.join(imgDir, file)
					archive.append(fs.createReadStream(filePath), { name: file })
				})
			}

			await archive.finalize()

			// 클라이언트에게 ZIP 파일 다운로드 응답 전송
			const zipFileStream = fs.createReadStream(zipPath)
			const encodedFileName = encodeURIComponent(zipFileName)
			const headers = new Headers({
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`
			})

			// 다운로드 완료 후 서버 측 ZIP 파일 제거
			zipFileStream.on('end', () => {
				fs.unlinkSync(zipPath)
			})

			return new Response(zipFileStream, { headers })
		} else {
			deleteDownloadedImages()
			return json({ message: 'Crawling stopped' })
		}
	} catch (error) {
		console.error('Error occurred during crawling:', error)
		return json({ error: 'An error occurred during crawling' }, { status: 500 })
	} finally {
		isCrawling = false
		if (browser) {
			await browser.close()
		}
		deleteDownloadedImages()
	}
}

export async function DELETE() {
	isCrawling = false
	if (browser) {
		await browser.close()
	}
	deleteDownloadedImages()
	return json({ message: 'Crawling stopped' })
}
