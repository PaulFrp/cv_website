import { BulletList, DetailSection, Paragraphs } from "./DetailBlocks";
import PhotoCarousel from "./PhotoCarousel";

function ComponentDecision({ section }) {
	return (
		<article className="detail-challenge">
			<h3>{section.title}</h3>
			<Paragraphs text={section.paragraphs} />
			<BulletList items={section.list} />
			{section.powerChain && (
				<p className="detail-power-chain">{section.powerChain}</p>
			)}
			{section.subsections?.map((subsection) => (
				<div key={subsection.title} className="detail-subsection">
					<h4>{subsection.title}</h4>
					<Paragraphs text={subsection.paragraphs} />
					{subsection.lesson && (
						<p className="detail-lesson">
							<strong>Lesson:</strong> {subsection.lesson}
						</p>
					)}
				</div>
			))}
			{section.batteryEstimate && (
				<div className="detail-battery-estimate">
					<strong>Battery life estimation:</strong>
					<BulletList items={section.batteryEstimate} />
				</div>
			)}
			{section.closing && <p>{section.closing}</p>}
			{section.note && <p className="detail-note">{section.note}</p>}
		</article>
	);
}

function AssemblyNotes({ notes, lesson }) {
	return (
		<article className="detail-challenge">
			<h3>{notes.title}</h3>
			<p>{notes.intro}</p>
			<BulletList items={notes.list} />
			{notes.closing && <p>{notes.closing}</p>}
			{lesson && (
				<p className="detail-lesson">
					<strong>The lesson:</strong> {lesson}
				</p>
			)}
		</article>
	);
}

/**
 * Hardware-focused layout for the plant tracker, which documents component
 * choices, firmware, and physical assembly rather than a software tech stack.
 */
function PlantTrackerDetailContent({ detail }) {
	const { hardwareAssembly, firmware } = detail;

	return (
		<>
			<div className="detail-meta">
				<p>
					<strong>Stack:</strong> {detail.stack}
				</p>
				<p>
					<strong>Skills:</strong> {detail.skills}
				</p>
				<p>
					<strong>Status:</strong> {detail.status}
				</p>
			</div>

			<DetailSection title="Overview">
				<Paragraphs text={detail.overview} />
			</DetailSection>

			<DetailSection title="Motivation">
				<Paragraphs text={detail.motivation} />
			</DetailSection>

			<DetailSection title="System architecture">
				<figure className="detail-figure">
					<img
						src={detail.architectureImage}
						alt={detail.architectureCaption}
						className="detail-architecture-image"
					/>
					<figcaption>{detail.architectureCaption}</figcaption>
				</figure>
			</DetailSection>

			<DetailSection title="Component decisions & trade-offs">
				{detail.componentDecisions.map((section) => (
					<ComponentDecision key={section.title} section={section} />
				))}
			</DetailSection>

			<DetailSection title="Firmware">
				<p>{firmware.intro}</p>
				<BulletList items={firmware.decisions} />
				<Paragraphs text={firmware.afterCode} />
				<p className="detail-gap">{firmware.gap}</p>
			</DetailSection>

			<DetailSection title="Hardware assembly">
				<PhotoCarousel
					photos={hardwareAssembly.photos ?? []}
					label="Hardware assembly photos"
				/>
				<AssemblyNotes notes={hardwareAssembly.solderingLessons} />
			</DetailSection>

			<DetailSection title="What I would do differently">
				<BulletList items={detail.doDifferently} />
			</DetailSection>

			<DetailSection title="What worked well">
				<BulletList items={detail.workedWell} />
			</DetailSection>

			<DetailSection title="Next steps">
				<BulletList items={detail.nextSteps} />
			</DetailSection>

		</>
	);
}

export default PlantTrackerDetailContent;
