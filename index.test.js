import test from 'ava';
import { Hotel } from './index';

test('hotel', t => {
	t.not(new Hotel(), undefined);
});

test('max power allowed', t => {
	const floors = 3;
	const mainCorridors = 2;
	const subCorridors = 4;
	const myHotel = new Hotel({ floors, mainCorridors, subCorridors });
	const maxPower = myHotel.getMaximumPowerConsumption();
	t.is(maxPower, ((mainCorridors * 15 + subCorridors * 10) * floors));
});

test('units used', t => {
	const myHotel = new Hotel({ floors: 2, mainCorridors: 1, subCorridors: 2 })
	let unitsConsumed = myHotel.getUnitsConsumed();
	t.is(unitsConsumed, 70);
});

test('motion at floor 1, sub corridor 2', t => {
	const myHotel = new Hotel({ floors: 2, mainCorridors: 1, subCorridors: 2 });
	myHotel.motionDetected({
		motion: true,
		floor: 1,
		corridor: 2,
		corridorType: 'sub'
	})

	let unitsConsumed = myHotel.getUnitsConsumed();
	t.is(unitsConsumed, 65);

	t.deepEqual(myHotel.getEquipmentStatus(), {
		floor_1: {
			mainCorridor_1: {
				light: 'ON',
				ac: 'ON'
			},
			subCorridor_1: {
				light: 'OFF',
				ac: 'OFF'
			},
			subCorridor_2: {
				light: 'ON',
				ac: 'ON'
			}
		},
		floor_2: {
			mainCorridor_1: {
				light: 'ON',
				ac: 'ON'
			},
			subCorridor_1: {
				light: 'OFF',
				ac: 'ON'
			},
			subCorridor_2: {
				light: 'OFF',
				ac: 'ON'
			}
		}
	});
});


test('No motion at floor 1, sub corridor 2', t => {
	const myHotel = new Hotel({ floors: 2, mainCorridors: 1, subCorridors: 2 });
	myHotel.motionDetected({
		motion: true,
		floor: 1,
		corridor: 2,
		corridorType: 'sub'
	})
	let result = myHotel.getEquipmentStatus();
	t.log(result);
	myHotel.motionDetected({
		motion: false,
		floor: 1,
		corridor: 2,
		corridorType: 'sub'
	})
	result = myHotel.getEquipmentStatus();
	t.log(result);
	t.deepEqual(result, {
		floor_1: {
			mainCorridor_1: {
				light: 'ON',
				ac: 'ON'
			},
			subCorridor_1: {
				light: 'OFF',
				ac: 'ON'
			},
			subCorridor_2: {
				light: 'OFF',
				ac: 'ON'
			}
		},
		floor_2: {
			mainCorridor_1: {
				light: 'ON',
				ac: 'ON'
			},
			subCorridor_1: {
				light: 'OFF',
				ac: 'ON'
			},
			subCorridor_2: {
				light: 'OFF',
				ac: 'ON'
			}
		}
	});
});

test('motion at floor 1, sb 1 with floor optimization',t => {
	const myHotel = new Hotel({floors:2, mainCorridors:1,subCorridors:2,optimizationType:"floor"});
	myHotel.motionDetected({
		motion:true,
		floor:1,
		corridor:1,
		corridorType:"sub"
	})
	t.deepEqual(myHotel.getEquipmentStatus(), {
		floor_1: {
			mainCorridor_1: {
				light: 'ON',
				ac: 'ON'
			},
			subCorridor_1: {
				light: 'ON',
				ac: 'ON'
			},
			subCorridor_2: {
				light: 'OFF',
				ac: 'ON'
			}
		},
		floor_2: {
			mainCorridor_1: {
				light: 'ON',
				ac: 'ON'
			},
			subCorridor_1: {
				light: 'OFF',
				ac: 'ON'
			},
			subCorridor_2: {
				light: 'OFF',
				ac: 'ON'
			}
		}
	});
})