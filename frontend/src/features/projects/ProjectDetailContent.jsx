import {
	BulletList,
	DetailSection,
	DetailTable,
	Paragraphs,
} from "./DetailBlocks";

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
			<div>
				<strong>Solution:</strong>
				<BulletList items={challenge.solution} />
			</div>
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

			<DetailSection title="Interesting code to highlight">
				<DetailTable
					headers={["Topic", "File", "Why it's interesting"]}
					rows={detail.codeHighlights.map((row) => ({
						key: row.file,
						cells: [row.topic, <code key={row.file}>{row.file}</code>, row.why],
					}))}
				/>
			</DetailSection>

			<DetailSection title="CV summary">
				<h3 className="detail-subheading">Short version</h3>
				<p>{detail.cvShort}</p>
				<h3 className="detail-subheading">Key challenges</h3>
				<BulletList items={detail.cvMedium} />
			</DetailSection>

			<DetailSection title="Technologies">
				<div className="detail-tags">
					{detail.techTags.map((tag) => (
						<span key={tag} className="detail-tag">
							{tag}
						</span>
					))}
				</div>
			</DetailSection>

			<DetailSection title="Lessons learned">
				<Paragraphs text={detail.lessonsLearned} />
			</DetailSection>
		</>
	);
}

export default ProjectDetailContent;
