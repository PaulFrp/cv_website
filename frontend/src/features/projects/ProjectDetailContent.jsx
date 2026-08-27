import {
	BulletList,
	DetailSection,
	DetailTable,
	Paragraphs,
} from "./DetailBlocks";
import PhotoCarousel from "./PhotoCarousel";

/**
 * Challenges are authored either as a plain string (a standalone note) or as a
 * `{ title, problem, solution }` object, so they are split before rendering.
 */
function splitChallenges(challenges = []) {
	const notes = [];
	const items = [];

	for (const entry of challenges) {
		if (typeof entry === "string") {
			notes.push(entry.trim());
		} else if (entry && typeof entry === "object") {
			items.push({
				...entry,
				solution: Array.isArray(entry.solution) ? entry.solution : [],
			});
		}
	}

	return { notes, items };
}

function Challenge({ challenge, index }) {
	return (
		<article className="detail-challenge">
			<h3>
				{index + 1}. {challenge.title}
			</h3>
			<div>
				<strong>Problem:</strong>
				<Paragraphs text={challenge.problem} />
			</div>
			{challenge.solution.length > 0 && (
				<div>
					<strong>Solution:</strong>
					<BulletList items={challenge.solution} />
				</div>
			)}
			{challenge.codeRefs?.length > 0 && (
				<div className="detail-code-refs">
					<strong>Key files:</strong>
					<ul>
						{challenge.codeRefs.map((ref) => (
							<li key={ref}>
								<code>{ref}</code>
							</li>
						))}
					</ul>
				</div>
			)}
		</article>
	);
}

/** Standard layout used by every project detail page except the plant tracker. */
function ProjectDetailContent({ detail }) {
	const { notes, items } = splitChallenges(detail.challenges);
	const photos = detail.photos ?? [];
	const codeHighlights = detail.codeHighlights ?? [];

	return (
		<>
			<Paragraphs text={detail.pitch} className="project-detail-pitch" />

			<DetailSection title="Tech stack">
				<DetailTable
					headers={["Layer", "Technologies"]}
					rows={detail.techStack.map((row) => ({
						key: row.layer,
						cells: [row.layer, row.technologies],
					}))}
				/>
			</DetailSection>

			<DetailSection title="Overview">
				<Paragraphs text={detail.overview} />
			</DetailSection>

			{photos.length > 0 && (
				<DetailSection title="Build photos">
					<PhotoCarousel photos={photos} label="Project photos" />
				</DetailSection>
			)}

			<DetailSection title="Problems encountered & solutions">
				{notes.map((note) => (
					<p key={note.slice(0, 48)} className="detail-challenge-note">
						{note}
					</p>
				))}
				{items.map((challenge, index) => (
					<Challenge
						key={challenge.title ?? index}
						challenge={challenge}
						index={index}
					/>
				))}
			</DetailSection>

			{codeHighlights.length > 0 && (
				<DetailSection title="Interesting code to highlight">
					<DetailTable
						headers={["Topic", "File", "Why it's interesting"]}
						rows={codeHighlights.map((row) => ({
							key: row.file,
							cells: [
								row.topic,
								<code key={row.file}>{row.file}</code>,
								row.why,
							],
						}))}
					/>
				</DetailSection>
			)}

			{detail.lessonsLearned && (
				<DetailSection title="Conclusion">
					<Paragraphs text={detail.lessonsLearned} />
				</DetailSection>
			)}
		</>
	);
}

export default ProjectDetailContent;
