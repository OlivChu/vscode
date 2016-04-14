/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import URI from 'vs/base/common/uri';
import {IInstantiationService} from 'vs/platform/instantiation/common/instantiation';
import {createInstantiationService} from 'vs/platform/instantiation/common/instantiationService';
import {TestFileService, TestLifecycleService, TestPartService, TestEditorService, TestConfigurationService, TestUntitledEditorService, TestStorageService, TestTelemetryService, TestContextService, TestMessageService, TestEventService} from 'vs/workbench/test/browser/servicesTestUtils';
import {WorkingFileEntry, WorkingFilesModel} from 'vs/workbench/parts/files/common/workingFilesModel';
import {TextFileService} from 'vs/workbench/parts/files/browser/textFileServices';
import {createMockModelService, createMockModeService} from 'vs/editor/test/common/servicesTestUtils';

let baseInstantiationService: IInstantiationService;
let eventService: TestEventService;
let textFileService: TextFileService;

suite('Files - WorkingFilesModel', () => {

	setup(() => {
		eventService = new TestEventService();

		baseInstantiationService = createInstantiationService({
			eventService: eventService,
			messageService: new TestMessageService(),
			fileService: TestFileService,
			contextService: new TestContextService(),
			telemetryService: new TestTelemetryService(),
			storageService: new TestStorageService(),
			untitledEditorService: new TestUntitledEditorService(),
			editorService: new TestEditorService(),
			partService: new TestPartService(),
			modeService: createMockModeService(),
			modelService: createMockModelService(),
			lifecycleService: new TestLifecycleService(),
			configurationService: new TestConfigurationService()
		});

		textFileService = <TextFileService>baseInstantiationService.createInstance(<any>TextFileService);
		baseInstantiationService.registerService('textFileService', textFileService);
	});

	teardown(() => {
		eventService.dispose();
	});

	test("Removed files are added to the closed entries stack", function () {
		let model = baseInstantiationService.createInstance(WorkingFilesModel);
		let file1: URI = URI.create('file', null, '/file1');
		let file2: URI = URI.create('file', null, '/file2');
		let file3: URI = URI.create('file', null, '/file3');
		model.addEntry(file1);
		model.addEntry(file2);
		model.addEntry(file3);

		model.removeEntry(file2);
		model.removeEntry(file3);
		model.removeEntry(file1);

		let lastClosedEntry1: WorkingFileEntry[] = model.popLastClosedEntry();
		let lastClosedEntry2: WorkingFileEntry[] = model.popLastClosedEntry();
		let lastClosedEntry3: WorkingFileEntry[] = model.popLastClosedEntry();
		assert.equal(model.popLastClosedEntry(), null);

		assert.equal(lastClosedEntry1.length, 1);
		assert.equal(lastClosedEntry1[0].resource, file1);
		assert.equal(lastClosedEntry2.length, 1);
		assert.equal(lastClosedEntry2[0].resource, file3);
		assert.equal(lastClosedEntry3.length, 1);
		assert.equal(lastClosedEntry3[0].resource, file2);
	});

	test("Untitled entries are not added to the closed entries stack", function () {
		let model = baseInstantiationService.createInstance(WorkingFilesModel);
		let fileUri: URI = URI.create('file', null, '/test');
		let untitledUri: URI = URI.create('untitled', null);
		model.addEntry(fileUri);
		model.addEntry(untitledUri);

		model.removeEntry(fileUri);
		let lastClosedEntry: WorkingFileEntry[] = model.popLastClosedEntry();
		assert.equal(lastClosedEntry.length, 1);
		assert.equal(lastClosedEntry[0].resource, fileUri);

		model.removeEntry(untitledUri);
		assert.equal(model.popLastClosedEntry(), null);
	});

	test("Clearing the model adds all entries to the closed entries stack", function() {
		let model = baseInstantiationService.createInstance(WorkingFilesModel);
		model.addEntry(URI.create('file', null, '/foo'));
		model.addEntry(URI.create('file', null, '/bar'));
		assert.equal(model.popLastClosedEntry(), null);

		model.clear();
		let lastClosedEntry: WorkingFileEntry[] = model.popLastClosedEntry();
		assert.equal(lastClosedEntry.length, 2);
		assert.ok(lastClosedEntry[0].isFile);
		assert.ok(lastClosedEntry[1].isFile);

		assert.equal(model.popLastClosedEntry(), null);
	});
});