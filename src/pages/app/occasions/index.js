import { useEffect, useState } from 'react';

import { Collapse, Fab, ListItemButton, Stack, Typography, useTheme } from '@mui/material';

import { AccessTime, Add, Celebration, Done, ExpandLess, ExpandMore, HourglassTop } from '@mui/icons-material';

import useLedger from '@/contexts/LedgerContext.js';

import PrimaryLayout from '@/layouts/PrimaryLayout';

import EditOccasion from '@/components/occasions/EditOccasion.js';
import OccasionCard from '@/components/occasions/OccasionCard.js';
import Payouts from '@/components/occasions/Payouts.js';

export default function Occasions(props) {
    const theme = useTheme();

    const [editorOpen, setEditorOpen] = useState(false);
    const [editIsNew, setEditIsNew] = useState(false);
    const [editData, setEditData] = useState(null);

    const [payoutsOpen, setPayoutsOpen] = useState(false);
    const [payoutsOccasion, setPayoutsOccasion] = useState(null);

    const { occasions, people, ledger, group } = useLedger();

    function editOccasion(occasion) {
        setEditorOpen(true);
        setEditIsNew(false);
        setEditData(occasion);
    }

    function showPayouts(occasion) {
        setPayoutsOpen(true);
        setPayoutsOccasion(occasion);
    }

    const typeIcons = {
        active: (
            <HourglassTop
                fontSize="medium"
                sx={{ color: theme.palette.text.secondary }}
            />
        ),
        past: (
            <Done
                fontSize="medium"
                sx={{ color: theme.palette.text.secondary }}
            />
        ),
        upcoming: (
            <AccessTime
                fontSize="medium"
                sx={{ color: theme.palette.text.secondary }}
            />
        )
    };

    return (
        <>
            <EditOccasion
                open={editorOpen}
                onClose={() => {
                    setEditorOpen(false);
                    setEditData(null);
                }}
                isNew={editIsNew}
                editData={editData}
                people={people}
                group={group}
            />
            <Payouts
                onClose={() => {
                    setPayoutsOccasion(null);
                }}
                occasion={payoutsOccasion}
                people={people}
                open={payoutsOpen}
                setOpen={setPayoutsOpen}
            />

            <Fab
                color="secondary"
                sx={{ position: 'fixed', bottom: 96, right: 16, zIndex: 2 }}
                onClick={() => {
                    setEditorOpen(true);
                    setEditIsNew(true);
                    setEditData(null);
                }}
            >
                <Add />
            </Fab>

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: '15px',
                    border: 'none'
                }}
            >
                <Stack
                    direction="row"
                    gap={1}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Celebration fontSize="large" />
                    <Typography variant="h4">Occasions</Typography>
                </Stack>

                <Stack
                    direction="column"
                    width="100%"
                    gap={1}
                >
                    {occasions && (
                        <>
                            <OccasionGroup
                                occasionsType="active"
                                icon={typeIcons['active']}
                                occasions={occasions.filter((occasion) => occasion.timeState === 'active')}
                                people={people}
                                ledger={ledger}
                                editCallback={editOccasion}
                                payoutsCallback={showPayouts}
                                defaultOpen={true}
                            />
                            <OccasionGroup
                                occasionsType="upcoming"
                                icon={typeIcons['upcoming']}
                                occasions={occasions.filter((occasion) => occasion.timeState === 'upcoming')}
                                people={people}
                                ledger={ledger}
                                editCallback={editOccasion}
                                payoutsCallback={showPayouts}
                                defaultOpen={
                                    occasions.filter((occasion) => occasion.timeState === 'active').length === 0
                                }
                            />
                            <OccasionGroup
                                occasionsType="past"
                                icon={typeIcons['past']}
                                occasions={occasions && occasions.filter((occasion) => occasion.timeState === 'past')}
                                people={people}
                                ledger={ledger}
                                editCallback={editOccasion}
                                payoutsCallback={showPayouts}
                                defaultOpen={false}
                            />
                        </>
                    )}
                </Stack>
            </div>
        </>
    );
}

function OccasionGroup({ occasionsType, occasions, people, ledger, editCallback, payoutsCallback, icon, defaultOpen }) {
    const theme = useTheme();

    const [open, setOpen] = useState(occasions.length !== 0 ? defaultOpen : false);

    useEffect(() => {
        if (defaultOpen) {
            setOpen(occasions.length !== 0 ? defaultOpen : false);
        }
    }, [occasions, defaultOpen]);

    return (
        <Stack
            direction="column"
            width="100%"
        >
            <ListItemButton
                sx={{ width: '100%', height: 'auto', paddingX: '5px', borderRadius: '5px' }}
                onClick={() => {
                    setOpen((open) => !open);
                }}
                disabled={occasions.length === 0}
            >
                <Stack
                    direction="row"
                    width="100%"
                    gap={1}
                    justifyContent="center"
                    alignItems="center"
                >
                    {icon}
                    <Typography variant="h5">
                        {occasionsType.charAt(0).toUpperCase() + occasionsType.slice(1)}
                    </Typography>
                    <Stack
                        direction="row"
                        width="auto"
                        flexGrow={1}
                        justifyContent="flex-end"
                        alignItems="center"
                    >
                        {!open ? <ExpandMore color="secondary" /> : <ExpandLess color="secondary" />}
                    </Stack>
                </Stack>
            </ListItemButton>
            <Collapse
                in={open}
                style={{ width: '100%' }}
                unmountOnExit
                mountOnEnter
            >
                <Stack
                    direction="column"
                    mt={1}
                    width="100%"
                    gap={2}
                    mb={occasionsType === 'past' ? '80px' : 0}
                >
                    {occasions.length !== 0 && people.length !== 0
                        ? occasions.map((occasion) => {
                              return (
                                  <OccasionCard
                                      key={occasion._id}
                                      occasion={occasion}
                                      people={people}
                                      ledger={ledger}
                                      editCallback={editCallback}
                                      payoutsCallback={payoutsCallback}
                                      showPayoutsButton={occasionsType === 'past'}
                                      disableStats={occasionsType === 'upcoming'}
                                  />
                              );
                          })
                        : null}
                </Stack>
            </Collapse>
        </Stack>
    );
}

Occasions.getLayout = (page) => <PrimaryLayout>{page}</PrimaryLayout>;
